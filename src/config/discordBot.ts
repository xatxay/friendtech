import { Client, Events, GatewayIntentBits, Message } from 'discord.js';

const discordToken = process.env.DISCORD;
const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const notificationChannels: { [guildId: string]: string } = {};

client.on(Events.MessageCreate, (message: Message) => {
  console.log(`receive message: ${message.content}`);
  if (message.content === 'setNotifyHere' && message.member?.permissions.has('ManageChannels')) {
    console.log('setting notification channel');
    notificationChannels[message.guild?.id || ''] = message.channel.id;
    message.reply('Bot will send new trades here');
  }
});

client.login(discordToken);

async function sendNewTradeNotification(message: string): Promise<void> {
  for (const guildId in notificationChannels) {
    const channelId = notificationChannels[guildId];
    const channel = client.channels.cache.get(channelId);
    if (!channel) continue;
    if (channel.isTextBased()) {
      channel.send(message);
    }
  }
}

export { sendNewTradeNotification };
