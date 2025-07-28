import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes.js';
import DBconnection from './config/db.js';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;


DBconnection();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
  res.send('Auth Service running with MongoDB');
});

app.listen(PORT, () => {
  console.log(`Auth Service listening on port ${PORT}`);
});
