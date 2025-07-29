import Stripe from 'stripe';
import axios from 'axios';
import Order from '../models/order.model.js';
import dotenv from 'dotenv';
dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const webhookHandler = async (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook Error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
  const session = event.data.object;
  const { nftId, buyerId, userId } = session.metadata || {};

  try {
    if (session.mode === 'payment') {
      await Order.findOneAndUpdate(
        { stripeSessionId: session.id },
        { status: 'paid' },
        { new: true }
      );
      console.log(`Zahlung abgeschlossen für Order zu NFT ${nftId}`);

      // NFT als verkauft markieren
      if (nftId) {
        await axios.patch(`http://nft-service:3002/api/nft/sold/${nftId}`);
        console.log(` SoldCount für NFT ${nftId} wurde erhöht`);
      }
    }

    if (session.mode === 'subscription') {
      console.log(` Abo abgeschlossen für User ${userId}`);
      await axios.patch(`http://server-auth:3001/api/auth/subscribe/${userId}`);
    }
  } catch (error) {
    console.error(' Fehler beim Webhook:', error);
  }
}

  res.status(200).json({ received: true });
};
