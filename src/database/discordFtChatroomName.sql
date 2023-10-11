CREATE TABLE IF NOT EXISTS discord_ft_chatroom_sync(
    id SERIAL PRIMARY KEY,
    discord_id VARCHAR (255) NOT NULL,
    ft_chatroom_name VARCHAR(255) NOT NULL,
    wallet VARCHAR(255) UNIQUE NOT NULL,
    CONSTRAINT unique_wallet UNIQUE (wallet)
)