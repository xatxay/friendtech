import pool from './newPool';

async function insertJwtToken(discordUsername: string, discordId: string | number, token: string): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO user_jwt (discord_username, discord_id, token) VALUES ($1, $2, $3) ON CONFLICT (discord_username) DO UPDATE SET discord_id = $2, token = $3`,
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

async function getJwtTokenWithUsername(discordUsername: string): Promise<string | null> {
  try {
    const result = await pool.query(`SELECT token FROM user_jwt WHERE discord_username = $1`, [discordUsername]);
    if (result.rows.length > 0) {
      return result.rows[0].token;
    }
  } catch (err) {
    console.error(err);
  }
  return null;
}

export { insertJwtToken, getJwtToken, getJwtTokenWithUsername };
