import { Router } from "express";
import axios from "axios";
import { PAYMENT_URL } from "../config/serviceURLs.js";
import { verifyToken } from "../middleware/auth.middleware.js";

const router = Router();

async function forwardOrderBySession(req, res) {
  const { sessionId } = req.params;
  console.log("[payment.routes] GET order-by-session", sessionId);

  try {
    const upstream = `${PAYMENT_URL}/api/payment/orders/session/${encodeURIComponent(sessionId)}`;
    const r = await axios.get(upstream, {
      timeout: 8000,
      headers: {
        Authorization: req.headers.authorization || "",
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
        "If-None-Match": "",
        "If-Modified-Since": "0",
      },
      validateStatus: () => true,
    });

    res.set("Cache-Control", "no-store");
    if (r.status === 304) {
      return res.status(200).json({ status: "pending" });
    }
    return res.status(r.status).json(r.data);
  } catch (e) {
    const status = e.response?.status ?? 500;
    const data = e.response?.data ?? { message: e.message };
    console.error("[payment.routes] upstream error:", status, data);
    res.set("Cache-Control", "no-store");
    return res.status(status).json(data);
  }
}

// ✅ „neuer“ Pfad (empfohlen)
router.get("/api/payment/checkout/order-by-session/:sessionId", verifyToken, forwardOrderBySession);

// ✅ Alias für deinen aktuellen Frontend-Call
router.get("/api/checkout/order-by-session/:sessionId", verifyToken, forwardOrderBySession);

export default router;
