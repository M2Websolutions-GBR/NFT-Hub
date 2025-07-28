import Stripe from 'stripe';
import dotenv from 'dotenv';
import Order from '../models/order.model.js';
dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const createCheckoutSession = async (req, res) => {
  const { title, price, nftId, buyerId } = req.body;

  if (!title || !price || !nftId || !buyerId) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: title,
            },
            unit_amount: Math.round(price * 100),
          },
          quantity: 1,
        },
      ],
      metadata: {
        nftId,
        buyerId,
      },
      success_url: 'http://localhost:5173/success',
      cancel_url: 'http://localhost:5173/cancel',
    });

    // Bestellung in DB speichern
    const newOrder = new Order({
      nftId,
      buyerId,
      stripeSessionId: session.id,
      amount: price,
      status: 'pending',
    });
    await newOrder.save();

    res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('Stripe error:', err);
    res.status(500).json({ message: 'Failed to create Stripe session' });
  }
};
