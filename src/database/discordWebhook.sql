CREATE TABLE IF NOT EXISTS server_webhooks (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE,
    discord_username VARCHAR(255) NOT NULL DEFAULT 'default_username',
    server_id VARCHAR(255) NOT NULL,
    channel_id VARCHAR(255) NOT NULL,
    webhook_id VARCHAR(255) NOT NULL DEFAULT 'default_id',
    webhook_token VARCHAR(255) NOT NULL DEFAULT 'default_token',
    wallet VARCHAR(255) NOT NULL
)