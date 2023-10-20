import WebSocket from 'ws';
import { client } from '../activitiesTracker/discordBot';
import { getDefaultUserWallet, sendMessageToServer } from './discordWebhook';
import { insertReplyMessageNoDiscord, updateMessageAndDiscordId } from '@server/database/replyingMessageDb';
import { Message, ReplyingToMessage } from '@server/database/interface';

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
        console.log('Message received: ', messageObj.text);
        const messageText = messageObj.text;
        const displayName = messageObj.twitterName;
        const twitterName = displayName.replace(/^"|"$/g, '');
        const userPfp = messageObj.twitterPfpUrl;
        const chatRoomId = messageObj.chatRoomId;
        const sendingUserId = messageObj.sendingUserId;
        const defaultUserWallet = await getDefaultUserWallet();
        const imageUrl = messageObj.imageUrls[0];
        const messageId = messageObj.messageId;
        receivedMessage = messageText.replace(/^"|"$/g, ''); //replace " left and right
        console.log('$$$: ', messageId);
        const { replyingToMessage } = messageObj;
        if (replyingToMessage) {
          receivedMessage = receiveMessageFormat(replyingToMessage, replyingToMessageId, receivedMessage, displayName);
        }
        const replyingMessageSendingUserId = replyingToMessage?.sendingUserId;
        console.log('!name: ', twitterName);
        console.log('!chatRoomId: ', chatRoomId);
        console.log('!sendingUserId :', sendingUserId);
        console.log('!replyingtomessage: ', replyingToMessage);
        await insertReplyMessageNoDiscord(messageId, replyingToMessageId, replyingMessageSendingUserId, sendingUserId);
        if (sendingUserId !== defaultUserWallet) {
          if (receivedMessage || messageObj.status === 'error') {
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
  console.log('Discord message: ', message.content);
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
