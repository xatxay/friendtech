CREATE TABLE IF NOT EXISTS server_webhooks (
    id SERIAL PRIMARY KEY,
    username TEXT UNIQUE,
    discord_username VARCHAR(255) NOT NULL DEFAULT 'default_username',
    server_id TEXT NOT NULL,
    channel_id TEXT NOT NULL,
    webhook_id TEXT NOT NULL DEFAULT 'default_id',
    webhook_token TEXT NOT NULL DEFAULT 'default_token',
    wallet VARCHAR(255) NOT NULL
)