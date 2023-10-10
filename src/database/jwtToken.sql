CREATE TABLE IF NOT EXISTS user_jwt(
    id SERIAL PRIMARY KEY,
    discord_username VARCHAR(255) NOT NULL,
    discord_id VARCHAR(255) NOT NULL,
    token TEXT UNIQUE NOT NULL
)