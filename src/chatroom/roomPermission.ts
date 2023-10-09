import axios from 'axios';
import pool from '@server/database/newPool';

const loginToken = process.env.WSLOGIN;

async function getRoomPermission() {
  console.log('get room permission function');
  try {
    const headers = {
      Authorization: loginToken,
    };
    const response = await axios.get(process.env.ROOMPERMISSION, { headers });
    const username = response.data.holdings[0].username;
    const twitterName = response.data.holdings[0].name;
    const twitterNameNoEmoji = twitterName.replace(
      /([\uE000-\uF8FF]|\uD83C[\uDF00-\uDFFF]|\uD83D[\uDC00-\uDDFF])/g,
      '',
    );
    const balanceHolding = response.data.holdings[0].balance;
    const balanceEthValue = response.data.holdings[0].balanceEthValue;
    const chatRoomId = response.data.holdings[0].chatRoomId;
    console.log(
      `ROOM PERMISSION: \n username: ${username} | twitter name: ${twitterName} | holding: ${balanceHolding} | eth value: ${balanceEthValue}`,
    );
    return { username, twitterNameNoEmoji, balanceHolding, balanceEthValue, chatRoomId };
  } catch (err) {
    console.error(err);
    return null;
  }
}

async function insertChatRoomPermission() {
  try {
    const { username, twitterNameNoEmoji, balanceHolding, balanceEthValue, chatRoomId } = await getRoomPermission();
    await pool.query(
      `INSERT INTO chat_room_holdings (username, twitter_name, balance_holding, balance_eth_value, chat_room_id) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (username) DO UPDATE SET chat_room_id = $5`,
      [username, twitterNameNoEmoji, balanceHolding, balanceEthValue, chatRoomId],
    );
  } catch (err) {
    console.error(err);
  }
}
(async () => {
  //   await getRoomPermission();
  await insertChatRoomPermission();
})();
