import { ActivityType, ChannelType, Client, Events, GatewayIntentBits, Partials } from 'discord.js';
import { getUserFromDb, init } from './getUserFromDb';
import { getChatHistory, sendChatMessage } from '../chatroom/initalChatLoad';
// import { getChatRoomIdPermission } from '@server/chatroom/discordWebhook';
import { getChatRoomIdForDiscordChannel } from '@server/database/discordFtChatRoomSync';

const discordToken = process.env.DISCORD;
// const chatRoomId = process.env.CHATROOMCHANNEL;
export const tableName = {
  notification_channels: 'notification_channels',
  server_webhooks: 'server_webhooks',
};

//create the bot
export const client = new Client({
  //give the bot the events
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
  ],
  partials: [Partials.Channel, Partials.Message],
});

//event listener trigger once
client.once(Events.ClientReady, (c) => {
  console.log(`Let start tracking! ${c.user.tag}`);
  client.user.setActivity('https://twitter.com/IrregularIUP', { type: ActivityType.Playing });
  init(tableName.notification_channels);
  getChatHistory();
});

//trigger everytime an event occur
client.on('messageCreate', async (message) => {
  // const chatRoomId = await getChatRoomIdPermission(message.author.username);
  // console.log('@@@ CHATROOMID: ', chatRoomId);
  const chatRoomId = await getChatRoomIdForDiscordChannel(message.channel.id);
  if (message.author.bot) return;
  if (!message.author.bot || message.channel.type === ChannelType.DM) {
    await getUserFromDb(message, tableName.notification_channels);
    console.log('Received message in channel: ', message.channel.id);
    console.log(`Message from ${message.author.username}: ${message.content}`);
  }
  if (chatRoomId && message.channel.id === chatRoomId) {
    sendChatMessage(message, chatRoomId);
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
