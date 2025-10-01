import express from 'express';
import { webhookHandler } from '../controllers/webhook.controller.js';

const router = express.Router();

// Stripe Webhook → Rohdaten brauchen .raw middleware
router.post('/webhook/stripe', express.raw({ type: 'application/json' }), webhookHandler);

export default router;
