import { Message } from '@server/activitiesTracker/getUserFromDb';
import { ftWsEndpoint } from './initalChatLoad';
import { client } from '../activitiesTracker/discordBot';

const ws = new WebSocket(ftWsEndpoint);

export async function sendNewMessageNotification(message: string, channel_id: string): Promise<void> {
  try {
    const channel = client.channels.cache.get(channel_id);
    if (!channel || !channel.isTextBased()) return;
    channel.send(message);
  } catch (err) {
    console.error(err);
  }
}

export function sendChatMessage(message: Message): void {
  const ftMessage = {
    action: 'sendMessage',
    text: message.content,
    imagePaths: [],
    chatRoomId: '0x5399b71c0529d994e5c047b9535302d5f288d517',
  };
  console.log('Discord message: ', message.content);
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(ftMessage));
  } else {
    console.error('Websocket is not open. Cant send message');
  }
}
