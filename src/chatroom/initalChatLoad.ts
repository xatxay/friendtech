import WebSocket from 'ws';
import { client } from '../activitiesTracker/discordBot';
import { sendMessageToServer } from './discordWebhook';

export interface Message {
  content: string;
  guild: {
    id: string;
    name: string;
  };
  channel: {
    id: string;
    send: (message: string) => void;
  };
}

export const ftWsEndpoint = process.env.WSENDPOINT; //GET JWT TOKEN FOR THE LINK
let ws: WebSocket; //declare type

function initalizeWebsocket() {
  ws = new WebSocket(ftWsEndpoint);

  //open connection
  ws.on('open', function open() {
    console.log('Connected to Friend.tech Chat');
  });

  //when message is received
  ws.on('message', (data) => {
    const messageString = data.toString('utf-8'); //turn buffer to string
    const messageObj = JSON.parse(messageString);
    switch (messageObj.type) {
      case 'chatMessageResponse': {
        //message response
        console.log('Reponse status: ', messageObj.status);
        break;
      }
      case 'receivedMessage': {
        console.log('Message received: ', messageObj.text);
        const messageText = messageObj.text;
        const receivedMessage = messageText.replace(/^"|"$/g, ''); //replace " left and right
        const displayName = messageObj.twitterName;
        const twitterName = displayName.replace(/^"|"$/g, '');
        const userPfp = messageObj.twitterPfpUrl;
        console.log('!name: ', twitterName);
        if (messageObj.chatRoomId !== messageObj.sendingUserId) {
          sendMessageToServer(receivedMessage, twitterName, userPfp);
        }
        break;
      }
      case 'messages': {
        console.log('Old messages: ');
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
    setTimeout(initalizeWebsocket, 1000);
  });
}

initalizeWebsocket(); //function call

//heartbeat every 5 secs
setInterval(() => {
  if (ws.readyState === WebSocket.OPEN) {
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

export function sendChatMessage(message: Message, chatRoomId: string): void {
  const ftMessage = {
    action: 'sendMessage',
    text: message.content,
    imagePaths: [],
    chatRoomId: chatRoomId, //MAKE THIS DYNAMIC
  };
  // chatRoomId: '0x5399b71c0529d994e5c047b9535302d5f288d517'
  console.log('Discord message: ', message.content);
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(ftMessage));
  } else {
    console.error('Websocket is not open. Cant send message');
  }
}

export function getChatHistory(): void {
  const chatHistoryRequest = {
    action: 'requestMessages',
    chatRoomId: '0x5399b71c0529d994e5c047b9535302d5f288d517',
    pageStart: null,
  };
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(chatHistoryRequest));
  } else {
    console.error('Websocket is not open, cannot get chat history');
  }
}
