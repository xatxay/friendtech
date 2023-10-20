import express from 'express';

const app = express();
const PORT = 3000;

app.get('/connectwallet', (req, res) => {
  res.send('walletconnect');
});

app.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}/connectwallet`);
});
