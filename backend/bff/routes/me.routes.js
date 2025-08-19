import express from 'express';
import { getMe, getAvatarUploadSignature, updateMyProfile } from '../controllers/me.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post("/profile/avatar/sign", verifyToken, getAvatarUploadSignature);
router.get("/profile/avatar/sign", verifyToken, getAvatarUploadSignature);
router.get('/me', verifyToken, getMe);
router.patch("/me", verifyToken, updateMyProfile);

export default router;
