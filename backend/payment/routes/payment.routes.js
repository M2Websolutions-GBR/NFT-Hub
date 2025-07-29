import express from 'express';
import { createCheckoutSession, createSubscriptionCheckout } from '../controllers/payment.controller.js';

const router = express.Router();

router.post('/create-checkout-session', createCheckoutSession);
router.post('/create-subscription-session', createSubscriptionCheckout);


export default router;
