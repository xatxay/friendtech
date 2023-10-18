import axios from 'axios';
import pool from '@server/database/newPool';
import { client } from '@server/activitiesTracker/discordBot';
import { ChannelType, TextChannel } from 'discord.js';
// import { setupWebhookForServer } from './discordWebhook';

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
interface DiscordChannelId {
  discord_channel_id: string;
}

const loginTokenWallet = process.env.LOGINTOKEN; //for getWalletWithUsername

async function getRoomPermission(loginToken: string): Promise<RoomPermission | null> {
  try {
    const headers = {
      Authorization: loginToken,
    };
    const response = await axios.get(`${process.env.ROOMPERMISSIONDEFAULT}`, { headers });
    const chatroomHolding = [];
    for (let i = 0; i < response.data.holdings.length; i++) {
      const username = response.data.holdings[i].username;
      const twitterName = response.data.holdings[i].name;
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
        chatRoomId,
        name: twitterNameNoEmoji,
      });
    }
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

async function insertChatRoomPermission(
  username: string,
  channel_name: string,
  chatRoomId: string,
  channelId: string,
  serverId: string,
): Promise<void> {
  try {
    // console.log('INSRT: ', loginToken);
    // const { holdings } = await getRoomPermission(loginToken);
    // for (const holding of holdings) {
    //   const { username, channel_name, chatRoomId } = holding;
    await pool.query(
      `INSERT INTO chat_room_holdings (username, channel_name, chat_room_id, discord_channel_id, server_id) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (username) DO UPDATE SET chat_room_id = $3, discord_channel_id = $4, server_id = $5`,
      [username, channel_name, chatRoomId, channelId, serverId],
    );
    // }
  } catch (err) {
    console.error('Failed inserting chat_room_holdings', err);
  }
}

// async function updateChatroomPermissionId(channelId: string, username: string): Promise<void> {
//   try {
//     await pool.query(`UPDATE chat_room_holdings SET discord_channel_id =$1 WHERE username = $2 `, [
//       channelId,
//       username,
//     ]);
//   } catch (err) {
//     console.error('Error updating the channelId ', err);
//   }
// }

async function manageChannelsPermission(loginToken: string, serverId: string): Promise<Array<string> | null> {
  try {
    const newCreatedChannelid = [],
      existingChannelIdArray = [];
    const data = await getRoomPermission(loginToken);
    const guild = client.guilds.cache.get(serverId);
    if (!guild) throw new Error('server id not found');
    const chatRoomPrefix = 'ft-';
    const existingChannels = guild.channels.cache.filter((channel) => channel.type === ChannelType.GuildText);
    const chatRoomDelete = guild.channels.cache.filter(
      (channel) => channel.type === ChannelType.GuildText && channel.name.startsWith(chatRoomPrefix),
    );
    existingChannels.forEach((channel) => {
      console.log('!@#EXISTINGCHANNEL: ', channel.id, '| ', channel.name);
    });
    chatRoomDelete.forEach((channel) => {
      console.log('!@#DELETECHANNEL: ', channel.id, '| ', channel.name);
    });
    //create channel if not exists
    for (const room of data.holdings) {
      const username = room.username;
      const chatRoomName = room.name
        .trim()
        .replace(/([\uE000-\uF8FF]|\uD83C[\uDF00-\uDFFF]|\uD83D[\uDC00-\uDDFF])/g, '')
        .replace(/[^a-zA-Z0-9]/g, '-')
        .toLowerCase();
      const wallet = room.chatRoomId;
      const channelName = chatRoomPrefix + chatRoomName;
      console.log('usernamewallet: ', username, 'asdsda: ', wallet);
      const existingChannelId = await selectDiscordChannelId(wallet);
      existingChannelIdArray.push(existingChannelId);
      console.log('exisitingchannelididid: ', existingChannelIdArray);
      const allChatRoomId: Array<DiscordChannelId> = await selectChatRoomId();
      console.log('allchatroomid: ', allChatRoomId);
      //delete channel
      const deleteChannels = allChatRoomId
        .filter((channel) => {
          return !existingChannelIdArray.includes(channel.discord_channel_id);
        })
        .map((chatRoom) => chatRoom.discord_channel_id);
      const promises = Array.from(chatRoomDelete).map(async ([, channel]) => {
        if (deleteChannels.includes(channel.id)) {
          console.log(`Deleted channel ${channel.id}`);
          deleteData(channel.id);
          channel.delete();
        }
      });
      await Promise.all(promises);
      if (existingChannels.every((channel) => channel.id !== existingChannelId)) {
        const createChannel = await guild.channels.create({
          name: channelName,
          type: ChannelType.GuildText,
        });
        if (createChannel instanceof TextChannel) {
          const discordServerId = createChannel.guildId;
          const discordChannelId = createChannel.id;
          newCreatedChannelid.push(discordChannelId);
          await insertChatRoomPermission(username, channelName, wallet, discordChannelId, discordServerId);
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
async function selectDiscordChannelId(wallet: string): Promise<string | null> {
  const result = await pool.query(`SELECT discord_channel_id FROM chat_room_holdings WHERE chat_room_id = $1`, [
    wallet,
  ]);
  if (result.rows && result.rows.length > 0) {
    const discordChannelId = result.rows[0].discord_channel_id;
    return discordChannelId;
  }
  return null;
}

async function selectChatRoomId(): Promise<Array<DiscordChannelId>> {
  const result = await pool.query(`SELECT discord_channel_id FROM chat_room_holdings`);
  const allChannelId = result.rows;
  return allChannelId;
}

async function deleteData(channelId: string): Promise<void> {
  try {
    await pool.query(`DELETE FROM chat_room_holdings WHERE discord_channel_id = $1`, [channelId]);
  } catch (err) {
    console.error('Failed deleting row: ', err);
  }
}

export {
  getRoomPermission,
  insertChatRoomPermission,
  manageChannelsPermission,
  getWalletWithUsername,
  selectDiscordChannelId,
};
