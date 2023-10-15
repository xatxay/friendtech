CREATE TABLE IF NOT EXISTS replying_messages(
    id SERIAL PRIMARY KEY,
    message_id VARCHAR(255) NOT NULL,
    discord_message_id VARCHAR(255) NOT NULL,
    reply_to_message_id VARCHAR(255) NOT NULL,
    sending_user_id VARCHAR(255) NOT NULL
)