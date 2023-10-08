import { ActivityType, Client, Events, GatewayIntentBits } from 'discord.js';
import { getUserFromDb, init } from './getUserFromDb';
import { sendChatMessage } from '../chatroom/initalChatLoad';

const discordToken = process.env.DISCORD;
const chatRoomId = process.env.CHATROOMCHANNEL;
const tableName = {
  notification_channels: 'notification_channels',
};

//create the bot
export const client = new Client({
  //give the bot the events
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});

//event listener trigger once
client.once(Events.ClientReady, (c) => {
  console.log(`Let start tracking! ${c.user.tag}`);
  client.user.setActivity('https://twitter.com/IrregularIUP', { type: ActivityType.Playing });
  init(tableName.notification_channels);
});

//trigger everytime an event occur
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  getUserFromDb(message, tableName.notification_channels);
  console.log('Received message in channel: ', message.channel.id);
  if (message.channel.id === chatRoomId) {
    sendChatMessage(message);
  }
});

client.login(discordToken);

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
