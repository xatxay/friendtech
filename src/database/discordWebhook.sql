CREATE TABLE IF NOT EXISTS server_webhooks (
    username TEXT PRIMARY KEY,
    discord_username VARCHAR(255) UNIQUE NOT NULL,
    server_id TEXT NOT NULL,
    channel_id TEXT NOT NULL,
    webhook_id TEXT NOT NULL,
    webhook_token TEXT NOT NULL
)