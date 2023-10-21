import pool from '@server/database/newPool';
import { getUserWallet } from './FTScrape';
import { setCronjob } from './FTScrape';
import { createWebhook, insertWebhookForServer } from '@server/chatroom/discordWebhook';
import { InsertParams, UpdateParams, insertDatabase, updateDatabase } from '@server/database/insertDB';
import { getJwtToken, insertJwtToken } from '@server/database/jwtDB';
import { manageChannelsPermission } from '@server/chatroom/roomPermission';
import { getWalletWithUsername } from '@server/chatroom/roomPermission';
import { initalizeWebsocket } from '@server/chatroom/initalChatLoad';
import { getChatHistory } from '@server/chatroom/initalChatLoad';
import { Message } from '@server/database/interface';
import { TextChannel, Webhook } from 'discord.js';

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
  const args = message.content.trim().split(/ +/),
    command = args.shift().toLowerCase();
  if (command === '!setnotifyhere') {
    const username = args.join().toLowerCase(),
      serverId = message.guild.id,
      channelId = message.channel.id,
      channelName = message.guild.name;
    console.log('server name: ', channelName);
    //get wallet address to insert into the database
    insertUserDb(table, username, channelName, serverId, channelId, message);
    const monitor = setCronjob(channelId);
    setInterval(monitor, 15000);
  }
  if (command === '!setchatroom') {
    const username = args.join().toLowerCase(),
      serverId = message.guild.id,
      channelId = message.channel.id,
      channelName = message.guild.name,
      discordId = message.author.id,
      discordUsername = message.author.username,
      jwtToken = await getJwtToken(discordId),
      wallet = await getWalletWithUsername(username);
    console.log('server name: ', channelName);
    if (message.channel instanceof TextChannel) {
      let webhook: Webhook;
      const existingWebhooks = await message.channel.fetchWebhooks();
      webhook = existingWebhooks.first();
      if (webhook) {
        await insertWebhookForServer(username, discordUsername, serverId, channelId, wallet, webhook);
      } else {
        webhook = await createWebhook(channelId);
        await insertWebhookForServer(username, discordUsername, serverId, channelId, wallet, webhook);
      }
    }
    username
      ? message.channel.send('You are set! :)')
      : message.channel.send('Please enter your twitter username after !setchatroom');
    await manageChannelsPermission(jwtToken, serverId, wallet);
    // setInterval(async () => await manageChannelsPermission(jwtToken, serverId), 15000);
    getChatHistory(channelId);
    initalizeWebsocket(jwtToken, serverId); //function call
  }
  if (command === '!login') {
    const discordUsername = message.author.username,
      discordId = message.author.id,
      jwtToken = args.join();
    console.log('DM TOKEN: ', jwtToken);
    await insertJwtToken(discordUsername, discordId, jwtToken);
  }
}

// async function checkExistingUser(discordId: string | number): Promise<number> {
//   try {
//     const result = await pool.query(`SELECT discord_id FROM user_jwt WHERE discord_id = $1`, [discordId]);
//     return result.rowCount;
//   } catch (err) {
//     console.error('Failed checking existing user: ', err);
//     return null;
//   }
// }
export { getUserFromDb, init };
