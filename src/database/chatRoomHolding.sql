CREATE TABLE IF NOT EXISTS chat_room_holdings (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    channel_name VARCHAR(255) NOT NULL,
    chat_room_id VARCHAR(255) NOT NULL,
    discord_channel_id VARCHAR(255) NOT NULL,
    server_id VARCHAR(255) NOT NULL
)