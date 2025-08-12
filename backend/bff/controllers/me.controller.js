import axios from 'axios';
import { AUTH_URL, NFT_URL, PAYMENT_URL } from '../config/serviceURLs.js';

const safeGet = async (url, opts = {}, label) => {
  try {
    const res = await axios.get(url, opts);
    return res.data;
  } catch (err) {
    const status = err.response?.status || 'NO_RESPONSE';
    console.error(`[BFF] ${label} failed:`, status, err.response?.data || err.message);
    return null; // Fallback
  }
};

export const getMe = async (req, res) => {
  const userId = req.user.id;
  const authHeader = { headers: { Authorization: req.headers.authorization } };

  try {
    const user = await safeGet(`${AUTH_URL}/api/auth/user/${userId}`, {}, 'auth-service:user');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const uploads = await safeGet(`${NFT_URL}/api/nft/mine`, authHeader, 'nft-service:mine') || [];
    const orders = await safeGet(`${PAYMENT_URL}/api/orders/mine`, authHeader, 'payment-service:mine') || [];

    const paidOrders = orders.filter(o => o.status === 'paid');
    const isCreator = user.role === 'creator' && (user.isSubscribed ?? true);
    const isBuyer = paidOrders.length > 0;

    res.json({
      user,
      flags: { isCreator, isBuyer },
      stats: {
        uploadsCount: uploads.length,
        ordersCount: orders.length,
        paidOrdersCount: paidOrders.length
      },
      uploads,
      orders
    });
  } catch (err) {
    console.error('BFF /api/me unexpected error:', err.message);
    res.status(500).json({ message: 'failed to build profile' });
  }
};
