import axios from 'axios';
import { AUTH_URL, NFT_URL, PAYMENT_URL } from '../config/serviceURLs.js';

export const getAdminSummary = async (req, res) => {
  try {
    const auth = { headers: { Authorization: req.headers.authorization } };

    // Bestehende Endpunkte abrufen; falls sie fehlen, leere Arrays zurückgeben
    const [userRes, nftsRes, ordersRes] = await Promise.all([
      axios.get(`${AUTH_URL}/api/auth/me`, auth).catch(() => ({ data: null })),
      axios.get(`${NFT_URL}/api/nft`, auth).catch(() => ({ data: [] })),
      axios.get(`${PAYMENT_URL}/api/orders`, auth).catch(() => ({ data: [] }))
    ]);

    const users = userRes.data ? [userRes.data] : [];
    const nfts = Array.isArray(nftsRes.data) ? nftsRes.data : (nftsRes.data?.items || []);
    const orders = Array.isArray(ordersRes.data) ? ordersRes.data : (ordersRes.data?.items || []);

    res.json({
      counts: {
        users: users.length,
        nfts: nfts.length,
        orders: orders.length
      },
      preview: {
        users: users.slice(0, 5),
        nfts: nfts.slice(0, 5),
        orders: orders.slice(0, 5)
      }
    });
  } catch (e) {
    console.error('BFF /api/admin/summary error:', e.message);
    res.status(500).json({ message: 'Failed to build admin summary' });
  }
};
