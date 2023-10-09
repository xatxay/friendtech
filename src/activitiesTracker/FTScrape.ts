import axios from 'axios';
import { sendNewMessageNotification } from '../chatroom/initalChatLoad';
import Bignumber from 'bignumber.js';
import pool from '../database/newPool';
import { tableName } from './discordBot';

const loginToken = process.env.LOGINTOKEN;

async function getUsername(table_name: string, channel_id: string): Promise<string> {
  // console.log('THIS IS GET USERNAME: ', channel_id);
  try {
    const res = await pool.query(`SELECT username FROM ${table_name} WHERE channel_id = $1`, [channel_id]);
    if (res.rows.length > 0) {
      return res.rows[0].username;
    } else {
      throw new Error('No username found');
    }
  } catch (err) {
    console.error(err);
    return null;
  }
}

async function getUserWallet(channel_id: string): Promise<string> {
  // console.log('channel id: ', channel_id);
  if (!channel_id) {
    throw new Error('No channel_id provided');
  }
  try {
    const notificationChannelUsername = await getUsername(tableName.notification_channels, channel_id);
    if (!notificationChannelUsername) {
      console.log(`No username found for channel_id: ${channel_id}`);
      return null;
    }
    const headers = {
      Authorization: loginToken,
    };
    let apiUrl: string;
    if (notificationChannelUsername.toLowerCase() === 'default') {
      apiUrl = process.env.DEFAULTSEARCHUSERAPI;
    } else {
      apiUrl = `${process.env.SEARCHUSERAPI}${notificationChannelUsername}`;
    }
    try {
      const response = await axios.get(apiUrl, { headers });
      const users = response.data.users;
      if (!users || users.length === 0 || !users[0].address) {
        throw new Error('Error getting api response');
      }
      return users[0].address;
    } catch (err) {
      console.error('API error: ', err);
      throw new Error('Falied to get wallet from API');
    }
  } catch (err) {
    console.error(err);
    throw err;
  }
}

//fetching wallet api call
async function getTradeData(channel_id: string) {
  try {
    const headers = {
      Authorization: loginToken,
    };
    // console.log('fetching watchlist');
    const wallet = await getUserWallet(channel_id);
    // console.log('wallet: ', wallet);
    const apiUrl = `${process.env.API}${wallet}`;
    const response = await axios.get(apiUrl, { headers });
    return response.data;
  } catch (err) {
    console.error(err);
    return '';
  }
}

//repeat calling the api
function setCronjob(channel_id: string): () => Promise<void> {
  let oldData = '';
  return async function monitor() {
    try {
      const data = await getTradeData(channel_id);
      const newData = data.events;
      const newDataString = JSON.stringify(newData);
      console.log('monitoring@@@@@@@@@@@@@@@@@@@@@@@@@');
      //loop and covert to string to compare
      for (const trade of newData) {
        const tradeString = JSON.stringify(trade);
        if (!oldData.includes(tradeString)) {
          const ethAmount = new Bignumber(trade.ethAmount).dividedBy(new Bignumber('1000000000000000000')).toFixed(3);
          const message = `${trade.isBuy ? '🟢' : '🔴'} [${trade.trader.username}](https://twitter.com/${
            trade.trader.username
          }) ${trade.isBuy ? 'bought' : 'sold'} [${trade.subject.name}](https://twitter.com/${
            trade.subject.username
          }) key | ETH: ${ethAmount}`;
          sendNewMessageNotification(message, channel_id);
          console.log(message);
        }
        oldData = newDataString;
      }
    } catch (err) {
      console.error(err);
    }
  };
}

export { setCronjob, getUserWallet, getUsername };
//| ${new Date(trade.createdAt).toLocaleString()}

// async function setCronjob(channel_id: string): Promise<void> {
//   let oldData = '';
//   try {
//     const data = await getTradeData(channel_id);
//     const newData = data.events;
//     const newDataString = JSON.stringify(newData);
//     console.log('monitoring@@@@@@@@@@@@@@@@@@@@@@@@@');
//     //loop and covert to string to compare
//     for (const trade of newData) {
//       const tradeString = JSON.stringify(trade);
//       if (!oldData.includes(tradeString)) {
//         const ethAmount = new Bignumber(trade.ethAmount).dividedBy(new Bignumber('1000000000000000000')).toFixed(3);
//         const message = `${trade.isBuy ? '🟢' : '🔴'} [${trade.trader.username}](https://twitter.com/${
//           trade.trader.username
//         }) ${trade.isBuy ? 'bought' : 'sold'} [${trade.subject.name}](https://twitter.com/${
//           trade.subject.username
//         }) key | ETH: ${ethAmount}`;
//         sendNewTradeNotification(message, channel_id);
//         console.log(message);
//       }
//       oldData = newDataString;
//     }
//   } catch (err) {
//     console.error(err);
//   }
// }
