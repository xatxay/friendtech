CREATE TABLE IF NOT EXISTS chat_room_holdings (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    twitter_name VARCHAR(255) NOT NULL,
    balance_holding VARCHAR(255) NOT NULL,
    balance_eth_value VARCHAR(255) NOT NULL,
    chat_room_id VARCHAR(255) NOT NULL,
    discord_channel_id VARCHAR(255) NOT NULL,
    server_id VARCHAR(255) NOT NULL
)