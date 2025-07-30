import express from 'express';
import { register, login, getUserById, subscribeUser, renewSubscription } from '../controllers/auth.controller.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/user/:id', getUserById); 
router.patch('/subscribe/:id', subscribeUser);
router.patch('/renew-subscription/:userId', renewSubscription);



export default router;



// // Admin-only
// router.get('/admin/check', verifyToken, isAdmin, (req, res) => {
//   res.json({ message: 'Welcome, admin.' });
// });

// // Creator-only
// router.get('/creator/check', verifyToken, isCreator, (req, res) => {
//   res.json({ message: 'Welcome, creator.' });
// });