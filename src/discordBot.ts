import { ActivityType, Client, Events, GatewayIntentBits } from 'discord.js';
import pool from './newPool';
import startMonitoring from './FTScrape';

const discordToken = process.env.DISCORD;
//create the bot
const client = new Client({
  //give the bot the events
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});

//event listener trigger once
client.once(Events.ClientReady, (c) => {
  console.log(`Let start tracking! ${c.user.tag}`);
  client.user.setActivity('https://twitter.com/IrregularIUP', { type: ActivityType.Playing });
});

//trigger everytime an event occur
client.on('messageCreate', async (message) => {
  const args = message.content.trim().toLowerCase().split(/ +/);
  const command = args.shift().toLowerCase();
  if (command === '!setnotifyhere') {
    const username = args.join();
    const serverId = message.guild.id;
    const channelId = message.channel.id;
    const channelName = message.guild.name;
    console.log(channelName);
    try {
      await pool.query(
        'INSERT INTO notification_channels (username, channel_name, server_id, channel_id) VALUES ($1, $2, $3, $4) ON CONFLICT (server_id) DO UPDATE SET channel_id = $4',
        [username, channelName, serverId, channelId],
      );
      message.channel.send('Notification is set to this channel!');
    } catch (err) {
      console.error('Database insert/update failed: ', err);
      message.channel.send(`There's error setting the notification channel`);
    }
    startMonitoring(channelId);
  }
});

client.login(discordToken);

async function sendNewTradeNotification(message: string): Promise<void> {
  try {
    const res = await pool.query('SELECT * FROM notification_channels');
    //loop through database to get the user's channel id and send message
    for (const row of res.rows) {
      const channel = client.channels.cache.get(row.channel_id);
      if (!channel || !channel.isTextBased()) continue;
      channel.send(message);
    }
  } catch (err) {
    console.error(err);
  }
}

export { sendNewTradeNotification };

///////////////////////////////////////////////////////////////
/*import { Client, Events, GatewayIntentBits } from 'discord.js';

const discordToken = process.env.DISCORD;
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once(Events.ClientReady, (c) => {
  console.log(`Let start tracking! ${c.user.tag}`);
});

client.login(discordToken);

async function sendNewTradeNotification(message: string): Promise<void> {
  const channel = client.channels.cache.get(process.env.CHANNEL);
  if (!channel) return console.error('channel not found');
  if (channel.isTextBased()) {
    channel.send(message);
  }
}

export { sendNewTradeNotification };
*/
