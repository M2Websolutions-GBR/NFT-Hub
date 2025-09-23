import express from 'express';
import { verifyToken, isAdmin, isCreator } from '../middleware/auth.middleware.js';
import { getMyOrders, getAllOrders, refundOrder, voidOrder, getOrderBySession, getMyOrdersAsCreator } from '../controllers/order.controller.js';
import { isContext } from 'vm';

const router = express.Router();

// GET /api/orders/mine → nur eigene Orders
router.get('/orders/mine', verifyToken, getMyOrders);
router.get("/orders", verifyToken, isAdmin, getAllOrders);
router.get("/mine/creator", verifyToken, isCreator, getMyOrdersAsCreator);
router.patch('/orders/:id/refund', verifyToken, isAdmin, refundOrder);
router.patch('/orders/:id/void', verifyToken, isAdmin, voidOrder);
router.get("/orders/session/:sessionId", verifyToken, getOrderBySession);

export default router;
