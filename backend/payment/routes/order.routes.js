import express from 'express';
import { verifyToken } from '../middleware/auth.middleware.js';
import { getMyOrders } from '../controllers/order.controller.js';

const router = express.Router();

// GET /api/orders/mine → nur eigene Orders
router.get('/orders/mine', verifyToken, getMyOrders);

export default router;
