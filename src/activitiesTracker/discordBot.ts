import { ActivityType, ChannelType, Client, Events, GatewayIntentBits, Partials } from 'discord.js';
import { getUserFromDb, init } from './getUserFromDb';
import { sendChatMessage } from '../chatroom/initalChatLoad';
import { getChatRoomIdPermission, getUsernameFromWebhook } from '@server/chatroom/discordWebhook';
import { getWalletWithUsername } from '@server/chatroom/roomPermission';
// import { getJwtTokenWithUsername } from '@server/database/jwtDB';
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
  let defaultUserChannelId: string, wallet: string;
  if (message.channel.type !== ChannelType.DM && !message.content.startsWith('!setchatroom')) {
    const username = await getUsernameFromWebhook(message.channel.id);
    wallet = await getWalletWithUsername(username);
    defaultUserChannelId = await getChatRoomIdPermission(username);
    console.log('DEFAULTCHANNELID: ', defaultUserChannelId);
    console.log(username, wallet, '!!!!');
  }
  if (message.author.bot) return;
  if (!message.author.bot || message.channel.type === ChannelType.DM) {
    await getUserFromDb(message, tableName.notification_channels);
  }
  if (wallet && message.channel.id === defaultUserChannelId) {
    sendChatMessage(message, wallet);
  }
});

client.login(discordToken);
