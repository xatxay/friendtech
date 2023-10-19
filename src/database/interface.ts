import { Collection, Attachment } from 'discord.js';

export interface WebhookRow {
  webhook_id: string;
  rowCount: number;
}

export interface Message {
  content: string;
  guild: {
    id: string;
    name: string;
  };
  author: {
    username: string;
    id: string;
  };
  channel: {
    id: string;
    send: (message: string) => void;
  };
  attachments: Collection<string, Attachment>;
}

export interface ReplyingToMessage {
  messageId: string | number;
  text: string;
  twitterName: string;
}

export interface Holding {
  username: string;
  twitterNameNoEmoji: string;
  balanceHolding: string;
  balanceEthValue: string;
  chatRoomId: string;
  name: string;
}

export interface RoomPermission {
  holdings: Holding[];
}

export interface DiscordChannelId {
  discord_channel_id: string;
}

export interface WalletRow {
  rowCount: number;
}

export interface ImageResponse {
  signedUrl: string;
  path: string;
}

export interface InsertParams {
  tableName: string;
  columns: string[];
  values: (string | number)[];
  conflictColumn: string;
  updateColumn: string;
  message: Message;
}

export interface UpdateParams {
  tableName: string;
  setColumn: string;
  setValue: string;
  whereColumn: string;
  whereValue: string;
}

export interface SelectParams {
  tableName: string;
  columns: string[];
  whereColumn: string;
  whereValue: string;
}
