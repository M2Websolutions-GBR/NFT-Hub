import express from 'express';
import { uploadNFT, getAllNFTs, getMyNFTs, getCreatorProfile, getNFTById, updateNFT } from '../controllers/nft.controller.js';
import { verifyToken, isCreator } from '../middleware/auth.middleware.js';
import upload from '../middleware/upload.middleware.js';

const router = express.Router();

// Upload nur für eingeloggte Creator
router.post('/', verifyToken, isCreator, upload.single('image'), uploadNFT);
router.get('/', getAllNFTs); // Öffentliche Route
router.get('/mine', verifyToken, isCreator, getMyNFTs); // geschützt für Creator
router.get('/creator/:creatorId', getCreatorProfile);
router.get('/:id', getNFTById); // muss ganz unten stehen!
router.put('/:id', verifyToken, isCreator, updateNFT);

export default router;
