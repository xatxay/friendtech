import axios from 'axios';

async function walletLogin() {
  const wallet = process.env.WALLETCONNECT;
  const privayId = process.env.PRIVY_APP_ID;

  const initResponse = await axios.post(
    'https://auth.privy.io/api/v1/siwe/init',
    {
      address: wallet,
    },
    {
      headers: {
        'Privy-App-Id': privayId,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    },
  );
  console.log('Init respsonse: ', initResponse.data);
}
