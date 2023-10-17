import WebSocket from 'ws';
import { client } from '../activitiesTracker/discordBot';
import { getDefaultUserWallet, sendMessageToServer } from './discordWebhook';
import { insertReplyMessageNoDiscord, updateMessageAndDiscordId } from '@server/database/replyingMessageDb';
import { Attachment, Collection } from 'discord.js';

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

interface ReplyingToMessage {
  messageId: string | number;
  text: string;
  twitterName: string;
}

let ws: WebSocket; //declare type

export const initalizeWebsocket = (jwtToken: string): void => {
  const ftWsEndpoint = process.env.WSENDPOINT + jwtToken;
  ws = new WebSocket(ftWsEndpoint);

  //open connection
  ws.on('open', function open() {
    console.log('Connected to Friend.tech Chat');
  });

  //when message is received
  ws.on('message', async (data) => {
    const messageString = data.toString('utf-8'); //turn buffer to string
    const messageObj = JSON.parse(messageString);
    switch (messageObj.type) {
      case 'chatMessageResponse': {
        //message response
        console.log('Reponse status: ', messageObj.status);
        console.log({ messageObj });
        break;
      }
      case 'receivedMessage': {
        let replyingToMessageId: string | number, receivedMessage: string;
        console.log('Message received: ', messageObj.text);
        const messageText = messageObj.text;
        receivedMessage = messageText.replace(/^"|"$/g, ''); //replace " left and right
        const displayName = messageObj.twitterName;
        const twitterName = displayName.replace(/^"|"$/g, '');
        const userPfp = messageObj.twitterPfpUrl;
        const chatRoomId = messageObj.chatRoomId;
        const sendingUserId = messageObj.sendingUserId;
        const defaultUserWallet = await getDefaultUserWallet();
        const imageUrl = messageObj.imageUrls[0];
        const messageId = messageObj.messageId;
        console.log('$$$: ', messageId);
        const { replyingToMessage } = messageObj;
        if (replyingToMessage) {
          receivedMessage = receiveMessageFormat(replyingToMessage, replyingToMessageId, receivedMessage, displayName);
        }
        const replyingMessageSendingUserId = replyingToMessage?.sendingUserId;
        // console.log('DUSERWALLET***: ', defaultUserWallet);
        console.log('!name: ', twitterName);
        console.log('!chatRoomId: ', chatRoomId);
        console.log('!sendingUserId :', sendingUserId);
        console.log('!replyingtomessage: ', replyingToMessage);
        await insertReplyMessageNoDiscord(messageId, replyingToMessageId, replyingMessageSendingUserId, sendingUserId);
        if (sendingUserId !== defaultUserWallet) {
          if (receivedMessage) {
            await sendMessageToServer(receivedMessage, twitterName, userPfp, chatRoomId);
          }
          if (imageUrl) {
            await sendMessageToServer(imageUrl, twitterName, userPfp, chatRoomId);
          }
        }
        await updateMessageAndDiscordId();
        break;
      }
      case 'messages': {
        // console.log('Old messages: ');
        // console.log('Old messages: ', messageObj.messages);
        break;
      }
      default: {
        console.log('Unhandled message type: ', messageObj);
        break;
      }
    }
  });

  //Handle errors
  ws.on('error', console.error);

  //see why websocket connection closes and reconnect
  ws.on('close', (code, reason) => {
    console.log(`Websocket closed with code: ${code}. Reason: ${reason.toString()}`);
    //attempt to reconnect
    setTimeout(() => {
      if (jwtToken) {
        initalizeWebsocket(jwtToken);
      }
    }, 1000);
  });
};

//heartbeat every 5 secs
setInterval(() => {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.ping(); //built in ping pong
  }
}, 5000);

export async function sendNewMessageNotification(message: string, channel_id: string): Promise<void> {
  try {
    const channel = client.channels.cache.get(channel_id);
    if (!channel || !channel.isTextBased()) return;
    channel.send(message);
  } catch (err) {
    console.error(err);
  }
}

export function sendChatMessage(
  message: Message,
  chatRoomId: string,
  replyingToMessageId: number = null,
  path: string[] = [],
): void {
  const ftMessage = {
    action: 'sendMessage',
    text: message.content,
    imagePaths: path,
    chatRoomId: chatRoomId,
    replyingToMessageId: replyingToMessageId,
  };
  // chatRoomId: '0x5399b71c0529d994e5c047b9535302d5f288d517'
  console.log('Discord message: ', message.content);
  // console.log({ wsReadyState: ws.readyState, websocketOpen: WebSocket.OPEN });
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(ftMessage));
  } else {
    console.error('Websocket is not open. Cant send message');
  }
}

export function getChatHistory(channelId: string): void {
  const chatHistoryRequest = {
    action: 'requestMessages',
    chatRoomId: channelId,
    pageStart: null,
  };
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(chatHistoryRequest));
  } else {
    console.error('Websocket is not open, cannot get chat history');
  }
}

function receiveMessageFormat(
  replyingToMessage: ReplyingToMessage,
  replyingToMessageId: string | number,
  receivedMessage: string,
  twitterName: string,
): string {
  replyingToMessageId = replyingToMessage.messageId;
  console.log('replyingtomessageid: ', replyingToMessageId);
  return (receivedMessage = `📥 ${replyingToMessage.twitterName}: ${replyingToMessage.text}\n📤 ${twitterName}: ${receivedMessage}`);
}
