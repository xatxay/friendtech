import axios from 'axios';
import pool from '@server/database/newPool';
import { client } from '@server/activitiesTracker/discordBot';
import { ChannelType } from 'discord.js';

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

async function getRoomPermission(loginToken: string): Promise<RoomPermission | null> {
  console.log('get room permission function');
  try {
    const headers = {
      Authorization: loginToken,
    };
    const response = await axios.get(process.env.ROOMPERMISSION, { headers });
    const username = response.data.holdings[0].username;
    const twitterName = response.data.holdings[0].name;
    const twitterNameNoEmoji = twitterName.replace(
      /([\uE000-\uF8FF]|\uD83C[\uDF00-\uDFFF]|\uD83D[\uDC00-\uDDFF])/g,
      '',
    );
    const balanceHolding = response.data.holdings[0].balance;
    const balanceEthValue = response.data.holdings[0].balanceEthValue;
    const chatRoomId = response.data.holdings[0].chatRoomId;
    const name = response.data.holdings[0].name;
    console.log(
      `ROOM PERMISSION: \n username: ${username} | twitter name: ${twitterName} | holding: ${balanceHolding} | eth value: ${balanceEthValue}`,
    );
    return { holdings: [{ username, twitterNameNoEmoji, balanceHolding, balanceEthValue, chatRoomId, name }] };
  } catch (err) {
    if (err instanceof Error) {
      console.error('error getting permission: ', err.message);
    } else {
      console.error('error getting permission');
    }
    return null;
  }
}

async function insertChatRoomPermission(loginToken: string): Promise<void> {
  try {
    const {
      holdings: [{ username, twitterNameNoEmoji, balanceHolding, balanceEthValue, chatRoomId }],
    } = await getRoomPermission(loginToken);
    await pool.query(
      `INSERT INTO chat_room_holdings (username, twitter_name, balance_holding, balance_eth_value, chat_room_id) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (username) DO UPDATE SET chat_room_id = $5`,
      [username, twitterNameNoEmoji, balanceHolding, balanceEthValue, chatRoomId],
    );
  } catch (err) {
    console.error(err);
  }
}

async function manageChannelsPermission(loginToken: string, serverId: string): Promise<void> {
  try {
    const data = await getRoomPermission(loginToken);
    const guild = client.guilds.cache.get(serverId);
    if (!guild) throw new Error('server id not found');
    const existingChannels = guild.channels.cache.filter((channel) => channel.type === ChannelType.GuildText);
    //create channel if not exists
    for (const room of data.holdings) {
      const channelName = room.name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
      if (!existingChannels.some((channel) => channel.name === channelName)) {
        await guild.channels.create({ name: channelName, type: ChannelType.GuildText });
      }
    }
    // delete channels
    for (const channel of existingChannels.values()) {
      if (!data.holdings.some((room) => room.name.replace(/[^a-zA-Z0-9]/g, '-').toLocaleLowerCase() === channel.name)) {
        await channel.delete();
      }
    }
  } catch (err) {
    console.error('Error managing channels: ', err);
  }
}

export { getRoomPermission, insertChatRoomPermission, manageChannelsPermission };
