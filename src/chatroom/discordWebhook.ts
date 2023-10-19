import { client } from '@server/activitiesTracker/discordBot';
import pool from '@server/database/newPool';
import { TextChannel, Webhook, WebhookClient } from 'discord.js';
import { WebhookRow } from '@server/database/interface';

const createWebhook = async (channelId: string): Promise<Webhook | null> => {
  try {
    const channel = client.channels.cache.get(channelId);
    if (channel instanceof TextChannel) {
      const webhook = await channel.createWebhook({ name: 'Spidey Bot' });
      return webhook;
    }
    return null;
  } catch (err) {
    console.error('Error creating webhook: ', err);
    return null;
  }
};

async function insertWebhookForServer(
  username: string,
  discordUsername: string,
  serverId: string,
  channelId: string,
  wallet: string,
  webhook: Webhook,
): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO server_webhooks (username, discord_username, server_id, channel_id, webhook_id, webhook_token, wallet) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [username, discordUsername, serverId, channelId, webhook.id, webhook.token, wallet],
    );
  } catch (err) {
    console.error(err);
  }
}

async function sendMessageToServer(
  message: string,
  twitterName: string,
  userPfp: string,
  wallet: string,
): Promise<void> {
  const webhookData = await pool.query(`SELECT webhook_id, webhook_token FROM server_webhooks WHERE wallet = $1`, [
    wallet,
  ]);
  console.log('#WEBHOOKDATA: ', webhookData.rows);
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
    console.error(`No webhook found`);
  }
}

async function getChatRoomIdPermission(username: string): Promise<string | null> {
  try {
    const result = await pool.query(`SELECT channel_id FROM server_webhooks WHERE username = $1`, [username]);
    if (result.rows && result.rows.length > 0) {
      return result.rows[0].channel_id;
    }
  } catch (err) {
    console.error('Failed selecting token: ', err);
    return null;
  }
  return null;
}

async function getUsernameFromWebhook(channelId: string): Promise<string | null> {
  try {
    const result = await pool.query(`SELECT username FROM server_webhooks WHERE channel_id = $1`, [channelId]);
    if (result.rows && result.rows.length > 0) {
      return result.rows[0].username;
    }
  } catch (err) {
    console.error(err);
    return null;
  }
  return null;
}

async function getDefaultUserWallet(): Promise<string | null> {
  try {
    const defaultUserWallet = await pool.query(`SELECT wallet FROM server_webhooks WHERE id = 1`);
    if (defaultUserWallet.rows && defaultUserWallet.rows.length > 0) {
      return defaultUserWallet.rows[0].wallet;
    }
    return null;
  } catch (err) {
    console.error(err);
    return null;
  }
}

async function checkExistingWebhook(username: string): Promise<WebhookRow[] | null> {
  try {
    const resultId = await pool.query(`SELECT webhook_id FROM server_webhooks WHERE username = $1`, [username]);
    const webhookId = resultId.rows;
    return webhookId;
  } catch (err) {
    console.error('Error checking existing webhook ', err);
    return null;
  }
}

async function deleteWebhook(channelId: string): Promise<void> {
  try {
    await pool.query(`DELETE FROM server_webhooks WHERE channel_id = $1`, [channelId]);
  } catch (err) {
    console.error('Failed deleting channel: ', err);
  }
}

export {
  insertWebhookForServer,
  sendMessageToServer,
  getChatRoomIdPermission,
  getUsernameFromWebhook,
  getDefaultUserWallet,
  createWebhook,
  checkExistingWebhook,
  deleteWebhook,
};
