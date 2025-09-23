// bff-service/src/controllers/creator.controller.js
import axios from "axios";

const PAYMENT_BASE_URL = process.env.PAYMENT_URL || "http://payment-service:3003";
const AUTH_BASE_URL    = process.env.AUTH_URL    || "http://auth-service:3001";

// ⚠️ Auth-Routen sind bei dir singular: /api/user/:id
const AUTH_SINGLE_PATH = process.env.AUTH_SINGLE_PATH || "/api/auth/user";

export const listCreatorOrders = async (req, res) => {
  const status = String(req.query.status ?? "paid");
  const limit  = Number(req.query.limit ?? 20);
  const page   = Number(req.query.page  ?? 1);
  const q      = String(req.query.q     ?? "");

  const paymentUrl = `${PAYMENT_BASE_URL}/api/mine/creator`;

  try {
    // 1) Orders vom Payment-Service holen
    const pr = await axios.get(paymentUrl, {
      params: { status, limit, page, q },
      headers: {
        "x-user-id": req.user.id,
        authorization: req.headers.authorization || "",
      },
      timeout: 10_000,
      validateStatus: () => true,
    });

    if (pr.status >= 400) {
      console.error("[BFF→PAYMENT] non-200", pr.status, pr.data);
      return res.status(pr.status).json(pr.data || { message: "payment error" });
    }

    const { items = [], total = 0, pages = 1 } = pr.data || {};

    // 2) Käufer einzeln beim Auth-Service nachschlagen
    const buyerIds = [...new Set(items.map(i => String(i.buyerId)).filter(Boolean))];
    const buyersById = {};

    for (const id of buyerIds) {
      const url = `${AUTH_BASE_URL}${AUTH_SINGLE_PATH}/${id}`;
      try {
        const ur = await axios.get(url, {
          // bei dir ist /user/:id ungeschützt – Header schaden aber nicht
          headers: { authorization: req.headers.authorization || "" },
          timeout: 6000,
          validateStatus: () => true,
        });
        if (ur.status === 200 && ur.data) {
          const u = ur.data;
          buyersById[String(u.id || u._id || id)] = {
            name:  u.username || u.name || null,
            email: u.email || null,
          };
        } else {
          console.warn(`[BFF→AUTH] ${ur.status} ${url}`);
        }
      } catch (e) {
        console.warn(`[BFF→AUTH] lookup failed for ${id}:`, e?.message || e);
      }
    }

    // 3) Items anreichern (Preis/Währung + Käuferdaten)
    const enriched = items.map(i => {
      const uid = String(i.buyerId);
      const buyer = buyersById[uid] || {};
      return {
        id: String(i.id || i._id),
        nftId: String(i.nftId),
        buyerId: uid,

        // amount muss in Cents aus Payment kommen
        amount: (typeof i.amount === "number")
  ? i.amount
  : (typeof i.price === "number" ? i.price : 0),
        currency: (i.currency || "EUR").toUpperCase(),

        status: i.status,
        createdAt: i.createdAt,
        stripeSessionId: i.stripeSessionId,

        buyerName:  buyer.name  || null,
        buyerEmail: buyer.email || null,

        // optional – falls schon vorhanden
        nftTitle: i.nftTitle || null,
        nftImage: i.nftImage || null,
      };
    });

    res.setHeader("Cache-Control", "no-store");
    return res.json({ items: enriched, total, pages, page });
  } catch (err) {
    console.error(
      "[BFF] /creator/orders error:",
      err?.code || err?.message || err,
      "→ paymentUrl:", paymentUrl,
      "params:", { status, limit, page, q, creatorId: req.user.id }
    );
    return res.status(500).json({ message: "Internal server error" });
  }
};
