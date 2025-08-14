
import express from 'express';
import { getAdminSummary } from '../controllers/admin.controller.js';
import { verifyToken, isAdmin } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/admin/summary', verifyToken, isAdmin, getAdminSummary);

export default router;
