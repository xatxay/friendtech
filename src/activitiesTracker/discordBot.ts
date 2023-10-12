import { ActivityType, ChannelType, Client, Events, GatewayIntentBits, Partials } from 'discord.js';
import { getUserFromDb, init } from './getUserFromDb';
import { sendChatMessage } from '../chatroom/initalChatLoad';
import { getChatRoomIdPermission, getUsernameFromWebhook } from '@server/chatroom/discordWebhook';
import { getWalletWithUsername } from '@server/chatroom/roomPermission';
// import { getChatRoomIdForDiscordChannel } from '@server/database/discordFtChatRoomSync';

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
});

//trigger everytime an event occur
client.on('messageCreate', async (message) => {
  const username = await getUsernameFromWebhook(message.channel.id);
  const channelId = await getChatRoomIdPermission(username);
  // console.log('!!! username: ', username);
  const wallet = await getWalletWithUsername(username);
  // console.log('@@@ wallet: ', wallet);
  if (message.author.bot) return;
  // const chatRoomId = await getChatRoomIdForDiscordChannel(message.channel.id);
  if (!message.author.bot || message.channel.type === ChannelType.DM) {
    await getUserFromDb(message, tableName.notification_channels);
    // console.log('Received message in channel: ', message.channel.id);
    // console.log(`Message from ${message.author.username}: ${message.content}`);
  }
  if (wallet && message.channel.id === channelId) {
    sendChatMessage(message, wallet);
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
