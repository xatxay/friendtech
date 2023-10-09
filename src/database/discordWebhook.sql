CREATE TABLE IF NOT EXISTS server_webhooks (
    username TEXT PRIMARY KEY,
    server_id TEXT NOT NULL,
    webhook_id TEXT NOT NULL,
    webhook_token TEXT NOT NULL
)