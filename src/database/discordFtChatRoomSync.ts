import pool from './newPool';

async function insertDiscordFtChatroomName(
  discordChannelName: string,
  ftChannelName: string,
  wallet: string,
): Promise<void> {
  try {
    pool.query(
      `INSERT INTO discord_ft_chatroom_sync (discord_id, ft_chatroom_name, wallet) VALUES ($1,$2,$3) ON CONFLICT wallet DO UPDATE SET  discord_id = $1, ft_chatroom_name = $2`,
      [discordChannelName, ftChannelName, wallet],
    );
  } catch (err) {
    console.error('Failed inserting dis/ft chatroom name: ', err);
  }
}

async function getChatRoomIdForDiscordChannel(discordChannelId: string): Promise<string | null> {
  try {
    const result = await pool.query(`SELECT ft_chatroom_name FROM discord_ft_chatroom_sync WHERE discord_id = $1`, [
      discordChannelId,
    ]);
    if (result.rows && result.rows.length > 0) {
      return result.rows[0].ft_chatroom_name;
    }
    return null;
  } catch (err) {
    console.error('Failed getting ftChatRoom: ', err);
    return null;
  }
}

export { insertDiscordFtChatroomName, getChatRoomIdForDiscordChannel };
