import WebSocket from 'ws';
import { sendNewMessageNotification } from '../chatroom/sendChatMessages';

export const ftWsEndpoint = process.env.WSENDPOINT;
const chatRoomId = process.env.CHATROOMCHANNEL;
let ws: WebSocket;

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
        const receivedMessage = messageText.replace(/^"|"$/g, '');
        sendNewMessageNotification(receivedMessage, chatRoomId);
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

  //see why websocket connection closes
  ws.on('close', (code, reason) => {
    console.log(`Websocket closed with code: ${code}. Reason: ${reason.toString()}`);
    //attempt to reconnect
    setTimeout(initalizeWebsocket, 1000);
  });
}

initalizeWebsocket(); //function call

//heartbeat every 15 secs
setInterval(() => {
  if (ws.readyState === WebSocket.OPEN) {
    ws.ping(); //built in ping pong
  }
}, 5000);
