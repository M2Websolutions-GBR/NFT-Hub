import express from 'express';
import { register, login, getUserById, subscribeUser, renewSubscription, getCurrentUser, updateMe, listUsersAdmin, suspendUser, unsuspendUser } from '../controllers/auth.controller.js';
import { verifyToken, isAdmin } from '../middleware/auth.middleware.js';



const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/user/:id', getUserById); 
router.patch('/subscribe/:id', subscribeUser);
router.patch('/renew-subscription/:userId', renewSubscription);
router.get('/me', verifyToken, getCurrentUser);
router.patch("/me", verifyToken, updateMe);

router.get("/admin/user", verifyToken, isAdmin, listUsersAdmin);
router.patch("/admin/user/:id/suspend", verifyToken, isAdmin, suspendUser);
router.patch("/admin/user/:id/unsuspend", verifyToken, isAdmin, unsuspendUser);

export default router;
