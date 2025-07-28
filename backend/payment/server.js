import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import DBconnection from './config/db.js';
import paymentRoutes from './routes/payment.routes.js';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3003;

DBconnection();

app.use(cors());
app.use(express.json()); // wichtig für req.body
app.use('/api/payment', paymentRoutes); // hier wird der Pfad richtig registriert

app.listen(PORT, () => {
  console.log(`Payment Service listening on port ${PORT}`);
});
