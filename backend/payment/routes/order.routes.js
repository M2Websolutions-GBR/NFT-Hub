import express from 'express';
import { verifyToken, isAdmin } from '../middleware/auth.middleware.js';
import { getMyOrders, getAllOrders, refundOrder, voidOrder, getOrderBySession } from '../controllers/order.controller.js';

const router = express.Router();

// GET /api/orders/mine → nur eigene Orders
router.get('/orders/mine', verifyToken, getMyOrders);
router.get("/orders", verifyToken, isAdmin, getAllOrders);
router.patch('/orders/:id/refund', verifyToken, isAdmin, refundOrder);
router.patch('/orders/:id/void', verifyToken, isAdmin, voidOrder);
router.get("/orders/session/:sessionId", verifyToken, getOrderBySession);

export default router;
