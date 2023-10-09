import { client } from '@server/activitiesTracker/discordBot';
import pool from '@server/database/newPool';
import { TextChannel, WebhookClient } from 'discord.js';

async function setupWebhookForServer(username: string, serverId: string, channelId: string): Promise<void> {
  const channel = client.channels.cache.get(channelId);
  if (channel instanceof TextChannel) {
    const webhook = await channel.createWebhook({ name: 'Spidey Bot' });
    try {
      await pool.query(
        `INSERT INTO server_webhooks (username, server_id, webhook_id, webhook_token) VALUES ($1, $2, $3, $4)`,
        [username, serverId, webhook.id, webhook.token],
      );
    } catch (err) {
      console.error(err);
    }
  } else {
    console.error('Cannot create a webhook in this channel');
  }
}

async function sendMessageToServer(
  serverId: string,
  message: string,
  username: string,
  userPfp: string,
): Promise<void> {
  const webhookData = await pool.query(`SELECT server_id FROM server_webhooks`);
  if (webhookData) {
    const webhook = new WebhookClient({
      id: webhookData.webhook_id,
      token: webhookData.webhook_token,
    });
    await webhook.send({
      content: message,
      username: username,
      avatarURL: userPfp,
    });
  } else {
    console.error(`No webhook found for server ${serverId}`);
  }
}

export { setupWebhookForServer, sendMessageToServer };
