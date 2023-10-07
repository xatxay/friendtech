import WebSocket from 'ws';
// import { Client, GatewayIntentBits } from 'discord.js';

const ftWsEndpoint = process.env.WSENDPOINT;
// const discordToken = process.env.DISCORD;

const ws = new WebSocket(ftWsEndpoint);
//open connection
ws.on('open', function open() {
  console.log('Connected to Friend.tech Chat');
  const message = {
    action: 'sendMessage',
    text: 'test1234545',
    imagePaths: [],
    chatRoomId: '0x5399b71c0529d994e5c047b9535302d5f288d517',
  };
  ws.send(JSON.stringify(message));
});

//when message is received
ws.on('message', (data) => {
  const messageString = data.toString('utf-8'); //turn buffer to string
  const messageObj = JSON.parse(messageString);
  switch (messageObj.type) {
    case 'chatMessageResponse':
      //message response
      console.log('Reponse status: ', messageObj.status);
      break;
    case 'receivedMessage':
      console.log('Message received: ', messageObj.text);
      break;
    default:
      console.log('Unhandled message type: ', messageObj);
  }
});

//Handle errors
ws.on('error', console.error);
// const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });
