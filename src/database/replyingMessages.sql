CREATE TABLE IF NOT EXISTS discord_message(
    id SERIAL NOT NULL,
    discord_message_id VARCHAR(255) PRIMARY KEY,
    discord_message_reply_id VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS replying_messages(
    id SERIAL PRIMARY KEY,
    message_id VARCHAR(255) NOT NULL,
    reply_to_message_id VARCHAR(255),
    reply_to_sending_user_id VARCHAR(255),
    sending_user_id VARCHAR(255) NOT NULL,
    discord_reference_message_id VARCHAR(255) REFERENCES discord_message (discord_message_id)
);