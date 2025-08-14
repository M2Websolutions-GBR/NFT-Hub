import express from 'express';
import { createCheckoutSession, createSubscriptionCheckout } from '../controllers/payment.controller.js';
import { verifyToken, isCreator } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/create-checkout-session', verifyToken, createCheckoutSession);
router.post('/create-subscription-session', verifyToken, isCreator, createSubscriptionCheckout);


export default router;
