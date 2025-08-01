import express from 'express';
import { checkNFTOwnership } from '../controllers/ownership.controller.js';

const router = express.Router();

router.get('/ownership/:nftId/:userId', checkNFTOwnership);

export default router;
