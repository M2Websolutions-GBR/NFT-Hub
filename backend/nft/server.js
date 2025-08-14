import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import DBconnection from './config/db.js';
import nftRoutes from './routes/nft.routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());
DBconnection();

app.use('/api', nftRoutes);




app.get('/', (req, res) => {
  res.send('NFT Service running with MongoDB');
});

app.listen(PORT, () => {
  console.log(`NFT Service listening on port ${PORT}`);
});
