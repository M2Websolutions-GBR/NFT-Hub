import { Router } from "express";
import axios from "axios";
import { NFT_URL } from "../config/serviceURLs.js";

const router = Router();

// Öffentliche Liste → proxyt auf NFT-Svc Root "/"
router.get("http://localhost:3002/api/nfts", async (req, res) => {
  try {
    const { data } = await axios.get(`${NFT_URL}/`); // ⚠️ genau auf "/" zeigen
    res.json(data);
  } catch (e) {
    const code = e?.response?.status || 500;
    res.status(code).json({ message: "Failed to load NFTs" });
  }
});

export default router;
