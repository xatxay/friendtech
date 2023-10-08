CREATE TABLE IF NOT EXISTS chat_room_holdings (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255), NOT NULL
    twitter_name VARCHAR(255) NOT NULL,
    balance_holding VARCHAR(255) NOT NULL,
    balanceEthValue VARCHAR(255) NOT NULL,
    chatRoomId VARCHAR(255)
)