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
    const { nftId, buyerId } = session.metadata;

    try {
      await Order.findOneAndUpdate(
        { stripeSessionId: session.id },
        { status: 'paid' },
        { new: true }
      );

      await axios.patch(`http://nft-service:3002/api/nft/sold/${nftId}`);
    } catch (error) {
      console.error('Fehler beim Verarbeiten des Webhooks:', error.message);
    }
  }

  res.status(200).json({ received: true });
};
