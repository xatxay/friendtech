CREATE TABLE IF NOT EXISTS notification_channels (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255),
    channel_name VARCHAR(255) NOT NULL,
    server_id VARCHAR(255) UNIQUE NOT NULL,
    channel_id VARCHAR(255) NOT NULL,
    wallet_address VARCHAR(255)
)

