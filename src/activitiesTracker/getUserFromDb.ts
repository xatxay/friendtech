import pool from '@server/database/newPool';
import { getUserWallet } from './FTScrape';
import { setCronjob } from './FTScrape';
import { setupWebhookForServer, updateNewCreatedChannel } from '@server/chatroom/discordWebhook';
import { InsertParams, UpdateParams, insertDatabase, updateDatabase } from '@server/database/insertDB';
import { insertChatRoomPermission } from '@server/chatroom/roomPermission';
import { getJwtToken, insertJwtToken } from '@server/database/jwtDB';
import { manageChannelsPermission } from '@server/chatroom/roomPermission';
import { getWalletWithUsername } from '@server/chatroom/roomPermission';
import { initalizeWebsocket } from '@server/chatroom/initalChatLoad';
import { getChatHistory } from '@server/chatroom/initalChatLoad';

// import { insertDiscordFtChatroomName } from '@server/database/discordFtChatRoomSync';

export interface Message {
  content: string;
  guild: {
    id: string;
    name: string;
  };
  channel: {
    id: string;
    send: (message: string) => void;
  };
  author: {
    username: string;
    id: string;
  };
}

async function init(tableName: string): Promise<void> {
  try {
    const res = await pool.query(`SELECT * FROM ${tableName}`);
    for (const row of res.rows) {
      const monitor = setCronjob(row.channel_id);
      setInterval(monitor, 15000);
    }
  } catch (err) {
    console.error(err);
  }
}

async function insertUserDb(
  tableName: string,
  username: string,
  channelName: string,
  serverId: string,
  channelId: string,
  message: Message,
) {
  const paramsForNotificationChannels: InsertParams = {
    tableName: tableName,
    columns: ['username', 'channel_name', 'server_id', 'channel_id'],
    values: [username, channelName, serverId, channelId],
    conflictColumn: 'server_id',
    updateColumn: 'channel_id',
    message: message,
  };
  try {
    await insertDatabase(paramsForNotificationChannels);
  } catch (err) {
    console.error('Unable to insert to database: ', err);
  }
  //need to get the username first to be able to use getUserWallet
  const wallet = await getUserWallet(channelId);
  console.log('MESSAGECREATE WALLET: ', wallet);
  const UpdateParamsNotificationChannels: UpdateParams = {
    tableName: tableName,
    setColumn: 'wallet_address',
    setValue: wallet,
    whereColumn: 'channel_id',
    whereValue: channelId,
  };
  try {
    await updateDatabase(UpdateParamsNotificationChannels);
  } catch (err) {
    console.error('Unable to update the database: ', err);
  }
}

async function getUserFromDb(message: Message, table: string): Promise<void | string> {
  const args = message.content.trim().split(/ +/);
  const command = args.shift().toLowerCase();
  if (command === '!setnotifyhere') {
    const username = args.join().toLowerCase();
    const serverId = message.guild.id;
    const channelId = message.channel.id;
    const channelName = message.guild.name;
    console.log('server name: ', channelName);
    //get wallet address to insert into the database
    insertUserDb(table, username, channelName, serverId, channelId, message);
    const monitor = setCronjob(channelId);
    setInterval(monitor, 15000);
  }
  if (command === '!setchatroom') {
    const username = args.join().toLowerCase();
    const serverId = message.guild.id;
    const channelId = message.channel.id;
    const channelName = message.guild.name;
    const discordId = message.author.id;
    const discordUsername = message.author.username;
    const jwtToken = await getJwtToken(discordId);
    await insertChatRoomPermission(jwtToken, message.channel.id, serverId);
    const wallet = await getWalletWithUsername(username);
    console.log('server name: ', channelName);
    await setupWebhookForServer(username, discordUsername, serverId, channelId, wallet);
    username
      ? message.channel.send('You are set! :)')
      : message.channel.send('Please enter your twitter username after !setchatroom');
    // await insertDiscordFtChatroomName(channelId, channelName, wallet);
    await updateNewCreatedChannel();
    const newCreatedChannelid = await manageChannelsPermission(jwtToken, serverId, discordUsername);
    console.log('setchatroom channelid: ', newCreatedChannelid);
    getChatHistory(channelId);
  }
  if (command === '!login') {
    const discordUsername = message.author.username;
    const discordId = message.author.id;
    const jwtToken = args.join();
    console.log('DM TOKEN: ', jwtToken);
    await insertJwtToken(discordUsername, discordId, jwtToken);
    initalizeWebsocket(jwtToken); //function call
  }
}
export { getUserFromDb, init };
