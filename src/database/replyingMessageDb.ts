import pool from './newPool';

async function insertReplyMessageNoDiscord(
  messageId: string | number,
  replyMessageId: string | number,
  replyMessageSendingUserId: string | number,
  sendingUserId: string | number,
): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO replying_messages (message_id, reply_to_message_id, reply_to_sending_user_id, sending_user_id) VALUES ($1, $2, $3, $4)`,
      [messageId, replyMessageId, replyMessageSendingUserId, sendingUserId],
    );
  } catch (err) {
    console.error('Error inserting replying_messages database ', err);
  }
}

async function insertDiscordId(discordId: string | number, discordReferenceId: string | number): Promise<void> {
  try {
    await pool.query(`INSERT INTO discord_message (discord_message_id, discord_message_reply_id) VALUES ($1, $2)`, [
      discordId,
      discordReferenceId,
    ]);
  } catch (err) {
    console.error('Error inserting discord_message_id database: ', err);
  }
}

async function updateMessageAndDiscordId(): Promise<void> {
  try {
    await pool.query(
      `UPDATE replying_messages SET discord_reference_message_id = discord_message_id FROM discord_message WHERE replying_messages.id = discord_message.id`,
    );
    console.log('Updating database+++');
  } catch (err) {
    console.error('Error updating replying_messages: ', err);
  }
}

async function selectMessageId(originalDiscordMessageId: string | number): Promise<number | null> {
  try {
    const result = await pool.query(`SELECT * FROM replying_messages WHERE discord_reference_message_id = $1`, [
      originalDiscordMessageId,
    ]);
    if (result.rows && result.rows.length > 0) {
      return result.rows[0].message_id;
    }
    return null;
  } catch (err) {
    console.error('Error selecting joined db: ', err);
    return null;
  }
}

export { insertReplyMessageNoDiscord, insertDiscordId, updateMessageAndDiscordId, selectMessageId };
