import WebSocket from 'ws';
import { client } from '../activitiesTracker/discordBot';
import { sendMessageToServer } from './discordWebhook';
import { insertReplyMessageNoDiscord } from '@server/database/replyingMessageDb';
import { Message, ReplyingToMessage } from '@server/database/interface';

let ws: WebSocket; //declare type
const messageCache: Set<string> = new Set();
const wsDict: { [key: string]: WebSocket } = {};

export const initalizeWebsocket = (jwtToken: string, serverId: string): void => {
  console.log('@@SERVERID: ', serverId);
  const ftWsEndpoint = process.env.WSENDPOINT + jwtToken;
  console.log('WSENDPOINT: ', ftWsEndpoint);
  ws = new WebSocket(ftWsEndpoint);

  //open connection
  ws.on('open', function open() {
    console.log('Connected to Friend.tech Chat');
  });

  //when message is received
  ws.on('message', async (data) => {
    const messageString = data.toString('utf-8'); //turn buffer to string
    const messageObj = JSON.parse(messageString);
    let replyingToMessageId: string | number, receivedMessage: string;
    switch (messageObj.type) {
      case 'chatMessageResponse': {
        //message response
        console.log('Reponse status: ', messageObj.status);
        console.log({ messageObj });
        if (messageObj.status === 'error') {
          receivedMessage = messageObj.message;
          console.log('error alert: ', receivedMessage);
        }
        break;
      }
      case 'receivedMessage': {
        console.log('ReceivedMessage format: ', messageObj); //check
        console.log('Message received: ', messageObj.text);
        const messageText = messageObj.text,
          displayName = messageObj.twitterName,
          twitterName = displayName.replace(/^"|"$/g, ''),
          userPfp = messageObj.twitterPfpUrl,
          chatRoomId = messageObj.chatRoomId,
          sendingUserId = messageObj.sendingUserId,
          // defaultUserWallet = await getDefaultUserWallet(),
          imageUrl = messageObj.imageUrls[0],
          messageId = messageObj.messageId,
          { replyingToMessage } = messageObj;
        receivedMessage = messageText.replace(/^"|"$/g, ''); //replace " left and right
        console.log('$$$: ', messageId);
        if (messageCache.has(messageId)) {
          return;
        }
        messageCache.add(messageId);
        if (replyingToMessage) {
          receivedMessage = receiveMessageFormat(replyingToMessage, replyingToMessageId, receivedMessage, displayName);
        }
        const replyingMessageSendingUserId = replyingToMessage?.sendingUserId;
        await insertReplyMessageNoDiscord(messageId, replyingToMessageId, replyingMessageSendingUserId, sendingUserId); //add server id
        if (receivedMessage || messageObj.status === 'error') {
          await sendMessageToServer(receivedMessage, twitterName, userPfp, chatRoomId);
        }
        if (imageUrl) {
          await sendMessageToServer(imageUrl, twitterName, userPfp, chatRoomId);
        }
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
  ws.on('error', (error) => {
    console.log('error connecting to socket: ', error);
    return;
  });

  //see why websocket connection closes and reconnect
  ws.on('close', (code, reason) => {
    console.log(`Websocket closed with code: ${code}. Reason: ${reason.toString()}`);
    //attempt to reconnect
    setTimeout(() => {
      if (jwtToken) {
        initalizeWebsocket(jwtToken, serverId);
      }
    }, 1000);
  });
  wsDict[serverId] = ws;
  // console.log('DICT$$$: ', wsDict);
};

//heartbeat every 5 secs
setInterval(() => {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.ping(); //built in ping pong
  }
}, 5000);

export function closeWebsocket(): void {
  if (ws) {
    console.log('close socket^^^^^^');
    if (ws.readyState === WebSocket.CLOSING) {
      console.log('WebSocket is closing');
    } else if (ws.readyState === WebSocket.CLOSED) {
      console.log('WebSocket is closed');
    }
  } else {
    return;
  }
}

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
  console.log('Discord message: ', message.content);
  console.log('sendvchatnmessage chatRoomId: ', chatRoomId);
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
  return (receivedMessage = `📥 ${replyingToMessage.twitterName}: ${replyingToMessage.text}\n\n📤 ${twitterName}: ${receivedMessage}`);
}
