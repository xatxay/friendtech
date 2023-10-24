import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 5000;

app.use(express.json());
app.use(cors());

app.post('/connectwallet', (req, res) => {
  const { key1, key2 } = req.body;
  console.log(`Received key1: ${key1}, key2: ${key2}`);
  res.json({ message: 'Data received successfully!' });
});

app.listen(PORT, () => {
  console.log(`SERVER RUNNING ON http://localhost:${PORT}/connectwallet`);
});
