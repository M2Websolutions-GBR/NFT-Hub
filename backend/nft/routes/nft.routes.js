import express from 'express';
import { uploadNFT, getAllNFTs, getMyNFTs, getCreatorProfile, getNFTById, updateNFT, deleteNFT, markAsSold, downloadNFT, blockNft, unblockNft, adjustSold} from '../controllers/nft.controller.js';
import { verifyToken, isCreator, isAdmin } from '../middleware/auth.middleware.js';
import upload from '../middleware/upload.middleware.js';
import { getByIds } from "../controllers/nft.controller.js";

const router = express.Router();

// Upload nur für eingeloggte Creator
router.post('/upload', verifyToken, isCreator, upload.single('image'), uploadNFT);
router.get('/', getAllNFTs); // Öffentliche Route
router.get('/mine', verifyToken, isCreator, getMyNFTs); // geschützt für Creator
router.get('/creator/:creatorId', getCreatorProfile);
router.get("/batch", verifyToken, getByIds);
router.put('/:id', verifyToken, isCreator, updateNFT);
router.delete('/:id', verifyToken, isCreator, deleteNFT);
router.patch('/sold/:id', markAsSold);
router.patch("/:id/sold", adjustSold);
router.get('/nft/download/:nftId', verifyToken, downloadNFT);
router.patch("/:id/block", verifyToken, isAdmin, blockNft);
router.patch("/:id/unblock", verifyToken, isAdmin, unblockNft);
router.get('/:id', getNFTById); // muss ganz unten stehen!

export default router;
