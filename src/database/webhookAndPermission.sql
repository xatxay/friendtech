CREATE TABLE IF NOT EXISTS chat_room_permission(
    id SERIAL NOT NULL,
    username VARCHAR(255) UNIQUE NOT NULL,
    twitter_name VARCHAR(255) NOT NULL,
    chat_room_id VARCHAR(255) NOT NULL,
    discord_channel_id VARCHAR(255) NOT NULL,
    server_id VARCHAR(255) NOT NULL
)

CREATE TABLE IF NOT EXISTS channel_webhooks (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE,
    discord_username VARCHAR(255),
    server_id VARCHAR(255) NOT NULL,
    channel_id VARCHAR(255) NOT NULL,
    webhook_id VARCHAR(255) NOT NULL,
    webhook_token VARCHAR(255) NOT NULL,
    wallet VARCHAR(255) NOT NULL
)