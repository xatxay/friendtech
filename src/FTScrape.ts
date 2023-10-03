import axios from 'axios';

const loginToken = process.env.LOGINTOKEN;

async function getTradeData() {
  try {
    const headers = {
      Authorization: loginToken,
    };
    console.log('fetching');
    const response = await axios.get(process.env.API, { headers });
    return response.data;
  } catch (err) {
    console.error(err);
    return '';
  }
}

async function setCronjob() {
  let oldData = '';
  setInterval(async () => {
    try {
      const data = await getTradeData();
      const newData = data.events;
      const newDataString = JSON.stringify(newData);
      console.log('monitoring@@@@@@@@@@@@@@@@@@@@@@@@@');
      for (const trade of newData) {
        const tradeString = JSON.stringify(trade);
        if (!oldData.includes(tradeString)) {
          console.log(
            `--------------New Trade-----------\n ${trade.trader.name} ${trade.isBuy ? 'bought' : 'sold'} ${
              trade.subject.name
            } key|ETH: ${(trade.ethAmount / 1000000000000000000).toFixed(2)} ${new Date(trade.createdAt)}`,
          );
        }
        oldData = newDataString;
      }
    } catch (err) {
      console.error(err);
    }
  }, 10000);
}

setCronjob();
