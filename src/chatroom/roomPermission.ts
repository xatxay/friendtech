import axios from 'axios';
import pool from '@server/database/newPool';
import { client } from '@server/activitiesTracker/discordBot';
import { ChannelType, TextChannel } from 'discord.js';
import { createWebhook, deleteWebhook, insertWebhookForServer } from './discordWebhook';
import { RoomPermission, DiscordChannelId, WalletRow } from '@server/database/interface';

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
    await pool.query(
      `INSERT INTO chat_room_holdings (username, channel_name, chat_room_id, discord_channel_id, server_id) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (username) DO UPDATE SET chat_room_id = $3, discord_channel_id = $4, server_id = $5`,
      [username, channel_name, chatRoomId, channelId, serverId],
    );
    // }
  } catch (err) {
    console.error('Failed inserting chat_room_holdings', err);
  }
}

async function manageChannelsPermission(loginToken: string, serverId: string): Promise<void> {
  try {
    let data = await getRoomPermission(loginToken);
    console.log('first data: ', data.holdings);
    setInterval(async () => {
      data = await getRoomPermission(loginToken);
      console.log('everyInterval: ', data.holdings);

      const guild = client.guilds.cache.get(serverId);
      const chatRoomPrefix = 'ft-';
      const existingChannels = guild.channels.cache.filter((channel) => channel.type === ChannelType.GuildText);
      const chatRoomDelete = guild.channels.cache.filter(
        (channel) => channel.type === ChannelType.GuildText && channel.name.startsWith(chatRoomPrefix),
      );
      if (!guild) throw new Error('server id not found');
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
        const updateChannel = await selectDiscordChannelId(wallet);
        const allChatRoomId: Array<DiscordChannelId> = await selectChatRoomId();
        const existingChannelId = allChatRoomId.map((channel) => channel.discord_channel_id);
        const existingChannelIdSet = new Set(existingChannelId);
        const checkExistChannel = await checkExistingChannel(wallet);
        console.log('updatechannel::: ', updateChannel);
        console.log('exisitingchannelididid: ', existingChannelId);
        console.log('usernamewallet: ', username, 'asdsda: ', wallet);
        console.log('allchatroomid: ', allChatRoomId);
        console.log('checkexistingchannel!: ', checkExistChannel.rowCount);
        //delete channels
        const deleteChannels = allChatRoomId
          .filter((channel) => {
            if (updateChannel) {
              return channel.discord_channel_id !== updateChannel;
            }
            return null;
          })
          .map((chatRoom) => chatRoom.discord_channel_id);
        console.log('DELETEEE: ', deleteChannels);
        const promises = Array.from(chatRoomDelete).map(async ([, channel]) => {
          if (deleteChannels.includes(channel.id)) {
            console.log(`Deleted channel ${channel.id}`);
            await deleteData(channel.id);
            await deleteWebhook(channel.id);
            channel.delete();
          }
        });
        await Promise.all(promises);
        //create channels
        console.log('set: ', existingChannelIdSet);
        if (checkExistChannel.rowCount === 0) {
          const createChannel = await guild.channels.create({
            name: channelName,
            type: ChannelType.GuildText,
          });
          if (createChannel instanceof TextChannel) {
            const discordServerId = createChannel.guildId;
            const discordChannelId = createChannel.id;
            const webhook = await createWebhook(discordChannelId);
            await insertWebhookForServer(username, channelName, discordServerId, discordChannelId, wallet, webhook);
            await insertChatRoomPermission(username, channelName, wallet, discordChannelId, discordServerId);
            console.log('Created channel: ', discordChannelId);
          }
        }
      }
    }, 50000);
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

async function checkExistingChannel(Wallet: string): Promise<WalletRow | null> {
  try {
    const result = await pool.query(`SELECT channel_name FROM chat_room_holdings WHERE chat_room_id = $1`, [Wallet]);
    return result;
  } catch (err) {
    console.error('Error checking exsiting channels: ', err);
    return null;
  }
}

export {
  getRoomPermission,
  insertChatRoomPermission,
  manageChannelsPermission,
  getWalletWithUsername,
  selectDiscordChannelId,
};
