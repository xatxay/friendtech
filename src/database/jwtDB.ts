import pool from './newPool';

async function insertJwtToken(discordUsername: string, discordId: string | number, token: string): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO user_jwt (discord_username, discord_id, token) VALUES ($1, $2, $3) ON CONFLICT (token) DO UPDATE SET discord_username = $1, discord_id = $2`,
      [discordUsername, discordId, token],
    );
  } catch (err) {
    console.error(err);
  }
}

async function getJwtToken(discordId: string): Promise<string | null> {
  try {
    const result = await pool.query(`SELECT token FROM user_jwt WHERE discord_id = $1`, [discordId]);
    if (result.rows.length > 0) {
      return result.rows[0].token;
    }
  } catch (err) {
    console.error(err);
  }
  return null;
}
export { insertJwtToken, getJwtToken };
