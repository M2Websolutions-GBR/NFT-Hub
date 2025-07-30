import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import DBconnection from './config/db.js';
import paymentRoutes from './routes/payment.routes.js';
// import orderRoutes from './routes/order.routes.js'; // deine API-Routen
import { webhookHandler } from './controllers/webhook.controller.js'; // gleich unten
import Stripe from 'stripe';


dotenv.config();

const app = express();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const PORT = process.env.PORT || 3003;

DBconnection();

// Nur für Webhook-Rohdaten (kommt **vor** express.json())
app.post('/api/webhook/stripe', express.raw({ type: 'application/json' }), webhookHandler);


app.use(cors());
app.use(express.json()); // wichtig für req.body
app.use('/api/payment', paymentRoutes); // hier wird der Pfad richtig registriert


app.listen(PORT, () => {
  console.log(`Payment Service listening on port ${PORT}`);
});
