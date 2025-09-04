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
            success_url: `${process.env.CLIENT_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.CLIENT_URL}/checkout/cancel`,
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

export const createSubscriptionCheckout = async (req, res) => {
    const { userId, email } = req.body;

    if (!userId || !email) {
        return res.status(400).json({ message: 'Missing userId or email' });
    }

    try {
        const session = await stripe.checkout.sessions.create({
            mode: 'subscription',
            payment_method_types: ['card'],
            customer_email: email,
            line_items: [
                {
                    price: process.env.STRIPE_CREATOR_SUBSCRIPTION_PRICE,
                    quantity: 1,
                },
            ],
            metadata: {
                userId,
            },
            success_url: 'http://localhost:5173/success-sub',
            cancel_url: 'http://localhost:5173/cancel-sub',
        });

        res.status(200).json({ url: session.url });
    } catch (err) {
        console.error('Stripe Subscription Error:', err);
        res.status(500).json({ message: 'Failed to create subscription session' });
    }
};

export const getOrderBySession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    if (!sessionId) return res.status(400).json({ message: "sessionId required" });

    const order = await Order.findOne({ stripeSessionId: sessionId });
    res.set("Cache-Control", "no-store");

    if (!order) return res.status(404).json({ message: "Order not found" });
    return res.json(order);
  } catch (e) {
    console.error("[payment] getOrderBySession error:", e.message);
    res.set("Cache-Control", "no-store");
    return res.status(500).json({ message: "Failed to load order" });
  }
};
