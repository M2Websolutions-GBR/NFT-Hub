import Stripe from 'stripe';
import dotenv from 'dotenv';
import Order from '../models/order.model.js';
import NFT from '../models/nft.model.js';

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const handleStripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const { nftId, buyerId } = session.metadata;

    try {
      const order = await Order.findOne({ stripeSessionId: session.id });
      if (!order) return res.status(404).send('Order not found');

      order.status = 'paid';
      await order.save();

      const nft = await NFT.findById(nftId);
      if (nft) {
        nft.soldCount += 1;
        if (nft.soldCount >= nft.editionLimit) {
          nft.isSoldOut = true;
        }
        await nft.save();
      }

      res.status(200).send('Order marked as paid');
    } catch (err) {
      console.error('Error updating order or NFT:', err);
      res.status(500).send('Internal Server Error');
    }
  } else {
    res.status(200).send('Unhandled event');
  }
};
