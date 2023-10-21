import { ActivityType, ChannelType, Client, Events, GatewayIntentBits, Partials } from 'discord.js';
import { getUserFromDb, init } from './getUserFromDb';
import { sendChatMessage } from '../chatroom/initalChatLoad';
import { getUsernameFromWebhook } from '@server/chatroom/discordWebhook';
import { getWalletWithUsername } from '@server/chatroom/roomPermission';
import { insertDiscordId, updateMessageAndDiscordId, selectMessageId } from '@server/database/replyingMessageDb';
import { getJwtTokenWithUsername } from '@server/database/jwtDB';
import { uploadImageSignedUrl } from '@server/chatroom/sendingImage';

const discordToken = process.env.DISCORD;
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
  const greeting = 'You are set! :)';
  let wallet: string,
    messageId: null | number,
    jwtToken: string,
    path: string[] = [],
    contentType: string,
    url: string;
  if (
    message.channel.type !== ChannelType.DM &&
    !message.content.startsWith('!setchatroom') &&
    !message.content.includes(greeting)
  ) {
    const discordMessageId = message.id;
    const originalDiscordMessageId = message.reference?.messageId;
    const serverId = message.guild.id;
    const username = await getUsernameFromWebhook(message.channel.id, serverId);
    jwtToken = await getJwtTokenWithUsername(message.author.username);
    wallet = await getWalletWithUsername(username);
    console.log(username, wallet, '!!!!');
    console.log('DISCORDMESSAGEID: ', discordMessageId);
    if (originalDiscordMessageId) {
      messageId = await selectMessageId(originalDiscordMessageId);
      console.log('originalDiscordMessageId: ', originalDiscordMessageId);
    }
    if (message.attachments) {
      message.attachments.each(async (attachment) => {
        url = attachment.url;
        contentType = attachment.contentType;
      });
    }
    await insertDiscordId(discordMessageId, originalDiscordMessageId);
    await updateMessageAndDiscordId();
  }
  // if (message.author.bot) return;
  if (!message.author.bot || message.channel.type === ChannelType.DM) {
    await getUserFromDb(message, tableName.notification_channels);
    if (wallet) {
      if (message.attachments.size > 0) {
        path = [await uploadImageSignedUrl(wallet, jwtToken, url, contentType)];
        sendChatMessage(message, wallet, messageId, path);
      } else {
        sendChatMessage(message, wallet, messageId, path);
      }
    }
  }
});
// originalDiscordMessageId = replyingToMessage.messageId

client.login(discordToken);
