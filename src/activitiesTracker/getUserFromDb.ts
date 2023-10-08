import pool from '@server/database/newPool';
import { getUserWallet } from './FTScrape';
import { setCronjob } from './FTScrape';

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
  try {
    await pool.query(
      `INSERT INTO ${tableName} (username, channel_name, server_id, channel_id) VALUES ($1, $2, $3, $4) ON CONFLICT (server_id) DO UPDATE SET channel_id = $4`,
      [username, channelName, serverId, channelId],
    );
    message.channel.send('Notification is set to this channel!');
  } catch (err) {
    console.error('Database insert/update failed: ', err);
    message.channel.send(`There's error setting the notification channel`);
  }
  //need to get the username first to be able to use getUserWallet
  try {
    const wallet = await getUserWallet(channelId);
    console.log('MESSAGECREATE WALLET: ', wallet);
    await pool.query(`UPDATE ${tableName} SET wallet_address = $1 WHERE channel_id = $2`, [wallet, channelId]);
  } catch (err) {
    console.error(err);
  }
}

async function getUserFromDb(message: Message, table: string): Promise<void> {
  const args = message.content.trim().toLowerCase().split(/ +/);
  const command = args.shift().toLowerCase();
  if (command === '!setnotifyhere') {
    const username = args.join();
    const serverId = message.guild.id;
    const channelId = message.channel.id;
    const channelName = message.guild.name;
    console.log('server name: ', channelName);
    //get wallet address to insert into the database
    insertUserDb(table, username, channelName, serverId, channelId, message);
    const monitor = setCronjob(channelId);
    setInterval(monitor, 15000);
  }
}
export { getUserFromDb, init };
