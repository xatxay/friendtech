import axios from 'axios';

const loginToken = process.env.LOGINTOKEN;

async function getTradeData() {
  try {
    const headers = {
      Authorization: loginToken,
    };
    const response = await axios.get(process.env.API, { headers });
    return response.data.events;
  } catch (err) {
    console.error(err);
    return '';
  }
}

(async () => {
  const data = await getTradeData();
  console.log(data);
})();
