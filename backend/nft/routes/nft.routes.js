import express from 'express';
import { uploadNFT } from '../controllers/nft.controller.js';
import { verifyToken, isCreator } from '../middleware/auth.middleware.js';

const router = express.Router();

// Upload nur für eingeloggte Creator
router.post('/', verifyToken, isCreator, uploadNFT);

export default router;
