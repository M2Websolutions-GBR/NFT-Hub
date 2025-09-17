import { Router } from "express";
import axios from "axios";
import { verifyToken, isCreator } from "../middleware/auth.middleware.js";

const router = Router();

const PAYMENT_BASE_URL = process.env.PAYMENT_BASE_URL || "http://payment-service:3003";
// const NFT_BASE_URL = process.env.NFT_BASE_URL || "http://nft-service:3002";

router.get("/creator/orders", verifyToken, isCreator, async (req, res) => {
  // Defaults sauber setzen
  const status = String(req.query.status ?? "paid");
  const limit = Number(req.query.limit ?? 20);
  const page  = Number(req.query.page  ?? 1);
  const q     = String(req.query.q     ?? "");

  const url = `${PAYMENT_BASE_URL}/api/mine/creator`;

  try {
    const r = await axios.get(url, {
      // ⬅️ creatorId zur Sicherheit auch als Query mitschicken
      params: { status, limit, page, q, creatorId: req.user.id },
      headers: {
        // ⬅️ beide Varianten weiterreichen
        "x-user-id": req.user.id,
        "authorization": req.headers.authorization || "",
      },
      timeout: 10_000,
      // ⬅️ wir prüfen Status selbst, um die Fehlermeldung durchzureichen
      validateStatus: () => true,
    });

    if (r.status >= 400) {
      console.error("[BFF→PAYMENT] non-200", r.status, r.data);
      return res.status(r.status).json(r.data || { message: "payment error" });
    }

    const { items = [], total = 0, pages = 1 } = r.data || {};
    res.setHeader("Cache-Control", "no-store");
    return res.json({ items, total, pages, page });
  } catch (err) {
    console.error(
      "[BFF] /creator/orders error:",
      err?.code || err?.message || err,
      "→ target:", url,
      "params:", { status, limit, page, q, creatorId: req.user.id }
    );
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
