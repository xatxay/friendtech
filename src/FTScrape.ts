import axios from 'axios';
import { sendNewTradeNotification } from './discordBot';
import Bignumber from 'bignumber.js';
import pool from './newPool';

const loginToken = process.env.LOGINTOKEN;

async function getUsername(channel_id: string): Promise<string> {
  try {
    const res = await pool.query('SELECT username FROM notification_channels WHERE channel_id = $1', [channel_id]);
    if (res.rows.length > 0) {
      return res.rows[0].username;
    } else {
      throw new Error('No username found');
    }
  } catch (err) {
    console.error(err);
    throw err;
  }
}

async function getUserWallet(channel_id: string) {
  try {
    const username = await getUsername(channel_id);
    const headers = {
      Authorization: loginToken,
    };
    let apiUrl: string;
    if (username.toLowerCase() === 'default') {
      apiUrl = process.env.DEFAULTSEARCHUSERAPI;
    } else {
      apiUrl = `${process.env.SEARCHUSERAPI}${username}`;
    }
    const response = await axios.get(apiUrl, { headers });
    return response.data.users[0].address;
  } catch (err) {
    console.error(err);
  }
}

//fetching wallet api call
async function getTradeData(channel_id: string) {
  try {
    const headers = {
      Authorization: loginToken,
    };
    console.log('fetching watchlist');
    const wallet = await getUserWallet(channel_id);
    console.log('wallet: ', wallet);
    const apiUrl = `${process.env.API}${wallet}`;
    const response = await axios.get(apiUrl, { headers });
    return response.data;
  } catch (err) {
    console.error(err);
    return '';
  }
}

//repeat calling the api
async function setCronjob(channel_id: string) {
  let oldData = '';
  setInterval(async () => {
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
          const message = `${trade.isBuy ? '🟢' : '🔴'} ${trade.trader.name} ${trade.isBuy ? 'bought' : 'sold'} ${
            trade.subject.name
          } key | ETH: ${ethAmount}`;
          sendNewTradeNotification(message);
          console.log(message);
        }
        oldData = newDataString;
      }
    } catch (err) {
      console.error(err);
    }
  }, 10000);
}

//needed server_id to get username so i have to pass server_id here
function startMonitoring(channel_id: string): void {
  setCronjob(channel_id);
}

export default startMonitoring;
//| ${new Date(trade.createdAt).toLocaleString()}
