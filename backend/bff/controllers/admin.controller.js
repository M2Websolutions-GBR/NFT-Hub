// controllers/admin.controller.js
import axios from "axios";
import { AUTH_URL, NFT_URL, PAYMENT_URL } from "../config/serviceURLs.js";

// Hilfsfunktion: Auth-Header durchreichen
function authHeaders(req) {
  return { headers: { Authorization: req.headers.authorization || "" } };
}

/* ======== SUMMARY ======== */
export const getAdminSummary = async (req, res) => {
  try {
    // Versuche möglichst "Listen"-Endpunkte zu nutzen.
    const [usersRes, nftsRes, ordersRes] = await Promise.all([
      // Falls du keinen Users-List-Endpoint hast, erstmal leeres Array liefern
      axios.get(`${AUTH_URL}/api/auth/user`, authHeaders(req)).catch(() => ({ data: [] })),
      axios.get(`${NFT_URL}/api/nft`, authHeaders(req)).catch(() => ({ data: [] })),
      axios.get(`${PAYMENT_URL}/api/orders`, authHeaders(req)).catch(() => ({ data: [] })),
    ]);

    const users = Array.isArray(usersRes.data) ? usersRes.data : (usersRes.data?.items || []);
    const nfts = Array.isArray(nftsRes.data) ? nftsRes.data : (nftsRes.data?.items || []);
    const orders = Array.isArray(ordersRes.data) ? ordersRes.data : (ordersRes.data?.items || []);

    res.json({
      counts: {
        users: users.length,
        nfts: nfts.length,
        orders: orders.length,
      },
      preview: {
        users: users.slice(0, 5),
        nfts: nfts.slice(0, 5),
        orders: orders.slice(0, 5),
      },
    });
  } catch (e) {
    console.error("BFF /api/admin/summary error:", e.message);
    res.status(500).json({ message: "Failed to build admin summary" });
  }
};

/* ======== NFTs ======== */
// Liste mit optionalen Filtern (?query, ?status, ?creatorId, ?limit)
export const listNfts = async (req, res) => {
  try {
    console.log("[listNfts] user:", { id: req.user?.id, role: req.user?.role }, "query:", req.query);

    const { query, status, creatorId, limit } = req.query;
    const params = {};
    if (query) params.query = query;
    if (status) params.status = status; // falls euer NFT-Service so etwas unterstützt
    if (creatorId) params.creatorId = creatorId;
    if (limit) params.limit = limit;

    const { data } = await axios.get(`${NFT_URL}/api/nft`, {
      ...authHeaders(req),
      params,
    });

    res.json(Array.isArray(data) ? data : (data?.items || []));
  } catch (e) {
    console.error("listNfts error:", e.message);
    res.status(500).json({ message: "Failed to load NFTs" });
  }
};

// NFT sperren
export const blockNft = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    // Variante A: direkter Patch am NFT-Service
    const { data } = await axios.patch(
      `${NFT_URL}/api/nft/${id}/block`,
      { isBlocked: true, blockedReason: reason, blockedAt: new Date().toISOString() },
      authHeaders(req),
    );

    res.json(data);
  } catch (e) {
    console.error("blockNft error:", e.message);
    res.status(500).json({ message: "Failed to block NFT" });
  }
};

// NFT entsperren
export const unblockNft = async (req, res) => {
  try {
    const { id } = req.params;

    const { data } = await axios.patch(
      `${NFT_URL}/api/nft/${id}/unblock`,
      { isBlocked: false, blockedReason: null, blockedAt: null },
      authHeaders(req),
    );

    res.json(data);
  } catch (e) {
    console.error("unblockNft error:", e.message);
    res.status(500).json({ message: "Failed to unblock NFT" });
  }
};

/* ======== USERS ======== */
// User-Liste
export const listUsers = async (req, res) => {
  try {
    console.log("[listUsers] user:", { id: req.user?.id, role: req.user?.role }, "query:", req.query);

    const { query, role, status, limit } = req.query;
    const params = {};
    if (query) params.query = query;
    if (role) params.role = role;
    if (status) params.status = status;
    if (limit) params.limit = limit;

    const { data } = await axios.get(`${AUTH_URL}/api/auth/admin/user`, {
      ...authHeaders(req),
      params,
    });

    res.json(Array.isArray(data) ? data : (data?.items || []));
  } catch (e) {
    console.error("listUsers error:", e.message);
    res.status(500).json({ message: "Failed to load users" });
  }
};

// User sperren
export const suspendUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, until } = req.body;

    // Patch am Auth-Service (du brauchst dort den Endpoint)
    const { data } = await axios.patch(
      `${AUTH_URL}/api/auth/admin/user/${id}/suspend`,
      { isSuspended: true, suspensionReason: reason || null, suspensionUntil: until || null },
      authHeaders(req),
    );

    res.json(data);
  } catch (e) {
    console.error("suspendUser error:", e.message);
    res.status(500).json({ message: "Failed to suspend user" });
  }
};

// User entsperren
export const unsuspendUser = async (req, res) => {
  try {
    const { id } = req.params;

    const { data } = await axios.patch(
      `${AUTH_URL}/api/auth/admin/user/${id}/unsuspend`,
      { isSuspended: false, suspensionReason: null, suspensionUntil: null },
      authHeaders(req),
    );

    res.json(data);
  } catch (e) {
    console.error("unsuspendUser error:", e.message);
    res.status(500).json({ message: "Failed to unsuspend user" });
  }
};

/* ======== ORDERS ======== */
// Bestellungen/Käufe
export const listOrders = async (req, res) => {
  try {
    console.log("[listOrders] user:", { id: req.user?.id, role: req.user?.role }, "query:", req.query);

    const { query, status, userId, nftId, limit } = req.query;
    const params = {};
    if (query) params.query = query;
    if (status) params.status = status;
    if (userId) params.userId = userId;
    if (nftId) params.nftId = nftId;
    if (limit) params.limit = limit;

    const { data } = await axios.get(`${PAYMENT_URL}/api/payment/orders`, {
      ...authHeaders(req),
      params,
    });

    res.json(Array.isArray(data) ? data : (data?.items || []));
  } catch (e) {
    console.error("listOrders error:", e.message);
    res.status(500).json({ message: "Failed to load orders" });
  }
};

// Refund
export const refundOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const { data } = await axios.patch(
      `${PAYMENT_URL}/api/admin/orders/${id}/refund`,
      { reason: reason || undefined },
      authHeaders(req),
    );

    res.json(data);
  } catch (e) {
    console.error("refundOrder error:", e.message);
    res.status(500).json({ message: "Failed to refund order" });
  }
};

// Void / Stornieren
export const voidOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const { data } = await axios.patch(
      `${PAYMENT_URL}/api/admin/orders/${id}/void`,
      { reason: reason || undefined },
      authHeaders(req),
    );

    res.json(data);
  } catch (e) {
    console.error("voidOrder error:", e.message);
    res.status(500).json({ message: "Failed to void order" });
  }
};
