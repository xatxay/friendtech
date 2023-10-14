import axios from 'axios';
import pool from '@server/database/newPool';
import { client } from '@server/activitiesTracker/discordBot';
import { ChannelType, TextChannel } from 'discord.js';
import { setupWebhookForServer } from './discordWebhook';

interface Holding {
  username: string;
  twitterNameNoEmoji: string;
  balanceHolding: string;
  balanceEthValue: string;
  chatRoomId: string;
  name: string;
}
interface RoomPermission {
  holdings: Holding[];
}

const loginTokenWallet = process.env.LOGINTOKEN; //for getWalletWithUsername

async function getRoomPermission(loginToken: string): Promise<RoomPermission | null> {
  // console.log('GET@: ', loginToken);
  try {
    const headers = {
      Authorization: loginToken,
    };
    const response = await axios.get(`${process.env.ROOMPERMISSIONDEFAULT}`, { headers });
    // console.log('RESPONSE:! :', response.data);
    const chatroomHolding = [];
    for (let i = 0; i < response.data.holdings.length; i++) {
      const username = response.data.holdings[i].username;
      const twitterName = response.data.holdings[i].name;
      const balanceHolding = response.data.holdings[i].balance;
      const balanceEthValue = response.data.holdings[i].balanceEthValue;
      const chatRoomId = response.data.holdings[i].chatRoomId;
      const twitterNameNoEmoji = twitterName.replace(
        /([\uE000-\uF8FF]|\uD83C[\uDF00-\uDFFF]|\uD83D[\uDC00-\uDDFF])/g,
        '',
      );
      // console.log(
      //   `ROOM PERMISSION: \n username: ${username} | twitter name: ${twitterName} | holding: ${balanceHolding} | eth value: ${balanceEthValue}`,
      // );
      chatroomHolding.push({
        username,
        twitterNameNoEmoji,
        balanceHolding,
        balanceEthValue,
        chatRoomId,
        name: twitterNameNoEmoji,
      });
    }
    // console.log('CHATROOMHOLDING: ', chatroomHolding);
    return { holdings: chatroomHolding };
  } catch (err) {
    if (err instanceof Error) {
      console.error('error getting permission: ', err.message);
    } else {
      console.error('error getting permission');
    }
    return null;
  }
}

async function insertChatRoomPermission(loginToken: string, channelId: string, serverId: string): Promise<void> {
  try {
    // console.log('INSRT: ', loginToken);
    const { holdings } = await getRoomPermission(loginToken);
    for (const holding of holdings) {
      const { username, twitterNameNoEmoji, balanceHolding, balanceEthValue, chatRoomId } = holding;
      await pool.query(
        `INSERT INTO chat_room_holdings (username, twitter_name, balance_holding, balance_eth_value, chat_room_id, discord_channel_id, server_id) VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (username) DO UPDATE SET chat_room_id = $5, discord_channel_id = $6, server_id = $7`,
        [username, twitterNameNoEmoji, balanceHolding, balanceEthValue, chatRoomId, channelId, serverId],
      );
    }
  } catch (err) {
    console.error('Failed inserting chat_room_holdings', err);
  }
}

async function updateChatroomPermissionId(channelId: string, username: string): Promise<void> {
  try {
    await pool.query(`UPDATE chat_room_holdings SET discord_channel_id =$1 WHERE username = $2 `, [
      channelId,
      username,
    ]);
  } catch (err) {
    console.error('Error updating the channelId ', err);
  }
}

async function manageChannelsPermission(
  loginToken: string,
  serverId: string,
  discordUsername: string,
): Promise<Array<string> | null> {
  try {
    const newCreatedChannelid = [];
    const data = await getRoomPermission(loginToken);
    const guild = client.guilds.cache.get(serverId);
    if (!guild) throw new Error('server id not found');
    const chatRoomPrefix = 'ft-';
    const existingChannels = guild.channels.cache.filter(
      (channel) => channel.type === ChannelType.GuildText && channel.name.startsWith(chatRoomPrefix),
    );
    //create channel if not exists
    for (const room of data.holdings) {
      const username = room.username;
      const channelName = chatRoomPrefix + room.name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
      const wallet = room.chatRoomId;
      if (!existingChannels.some((channel) => channel.name === channelName)) {
        const createChannel = await guild.channels.create({
          name: channelName,
          type: ChannelType.GuildText,
        });
        if (createChannel instanceof TextChannel) {
          const discordServerId = createChannel.guildId;
          newCreatedChannelid.push(createChannel.id);
          await setupWebhookForServer(username, discordUsername, discordServerId, createChannel.id, wallet);
          await updateChatroomPermissionId(createChannel.id, username);
        }
      } else {
        // delete channels
        for (const channel of existingChannels.values()) {
          if (
            !data.holdings.some(
              (room) => chatRoomPrefix + room.name.replace(/[^a-zA-Z0-9]/g, '-').toLocaleLowerCase() === channel.name,
            )
          ) {
            await channel.delete();
          }
        }
      }
    }
    return newCreatedChannelid;
  } catch (err) {
    console.error('Error managing channels: ', err);
    return null;
  }
}

async function getWalletWithUsername(username: string): Promise<string | null> {
  try {
    const headers = {
      Authorization: loginTokenWallet,
    };
    const response = await axios.get(`${process.env.SEARCHUSERAPI}${username}`, { headers });
    const wallet = response.data.users[0].address;
    return wallet;
  } catch (err) {
    console.error(err);
    return null;
  }
}
async function selectDiscordChannelId(username: string): Promise<string | null> {
  const result = await pool.query(`SELECT discord_channel_id FROM chat_room_holdings WHERE username = $1`, [username]);
  if (result.rows && result.rows.length > 0) {
    const discordChannelId = result.rows[0].discord_channel_id;
    return discordChannelId;
  }
  return null;
}

export {
  getRoomPermission,
  insertChatRoomPermission,
  manageChannelsPermission,
  getWalletWithUsername,
  selectDiscordChannelId,
};
