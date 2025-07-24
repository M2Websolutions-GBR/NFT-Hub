import express from 'express';
import { uploadNFT } from '../controllers/nft.controller.js';

const router = express.Router();

router.post('/', uploadNFT);

export default router;
