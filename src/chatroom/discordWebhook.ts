import { client } from '@server/activitiesTracker/discordBot';
import pool from '@server/database/newPool';
import { TextChannel, WebhookClient } from 'discord.js';

async function setupWebhookForServer(
  username: string,
  discordUsername: string,
  serverId: string,
  channelId: string,
): Promise<void> {
  const channel = client.channels.cache.get(channelId);
  if (channel instanceof TextChannel) {
    const webhookExist = await pool.query(`SELECT * FROM server_webhooks WHERE username = $1`, [username]);
    if (webhookExist.rowCount > 0) {
      console.log(`Webhook already exists for ${username}`);
      return;
    }
    const webhook = await channel.createWebhook({ name: 'Spidey Bot' });
    try {
      await pool.query(
        `INSERT INTO server_webhooks (username, discord_username, server_id, channel_id, webhook_id, webhook_token) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (discord_username) DO UPDATE SET username = $2, server_id = $3, channel_id = $4, webhook_id = $5, webhook_token = $6`,
        [username, discordUsername, serverId, channelId, webhook.id, webhook.token],
      );
    } catch (err) {
      console.error(err);
    }
  } else {
    console.error('Cannot create a webhook in this channel');
  }
}

async function sendMessageToServer(message: string, twitterName: string, userPfp: string): Promise<void> {
  const serverId = (await pool.query(`SELECT server_id FROM server_webhooks`)).rows[0].server_id; //MAKE THIS DYNAMIC
  console.log(`THIS IS THE WH SERVER ID: ${serverId}`);
  const webhookData = await pool.query(`SELECT webhook_id, webhook_token FROM server_webhooks WHERE server_id = $1`, [
    serverId,
  ]);
  if (webhookData && webhookData.rows.length > 0) {
    const webhook = new WebhookClient({
      id: webhookData.rows[0].webhook_id,
      token: webhookData.rows[0].webhook_token,
    });
    await webhook.send({
      content: message,
      username: twitterName,
      avatarURL: userPfp,
    });
  } else {
    console.error(`No webhook found for server ${serverId}`);
  }
}

async function getChatRoomIdPermission(discordUsername: string): Promise<string | void> {
  try {
    const result = await pool.query(`SELECT channel_id FROM server_webhooks WHERE discord_username = $1`, [
      discordUsername,
    ]);
    if (result.rows && result.rows.length > 0) {
      return result.rows[0].channel_id;
    }
  } catch (err) {
    console.error('Failed selecting token: ', err);
  }
}

export { setupWebhookForServer, sendMessageToServer, getChatRoomIdPermission };
