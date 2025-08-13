import axios from 'axios';
import { AUTH_URL, NFT_URL, PAYMENT_URL } from '../config/serviceURLs.js';

const safeGet = async (url, opts = {}, label) => {
  try {
    const res = await axios.get(url, opts);
    return { data: res.data, status: res.status };
  } catch (err) {
    const status = err.response?.status || 'NO_RESPONSE';
    console.error(`[BFF] ${label} failed:`, status, err.response?.data || err.message);
    return { data: null, status };
  }
};

export const getMe = async (req, res) => {

  const authHeader = { headers: { Authorization: req.headers.authorization } };

  try {
    const { data: user, status: userStatus } = await safeGet(`${AUTH_URL}/api/auth/me`, authHeader, 'auth-service:me');
    if (!user) {
      const code = userStatus === 'NO_RESPONSE' ? 503 : 404;
      return res.status(code).json({ message: code === 503 ? 'auth service unavailable' : 'User not found' });
    }
    const { data: uploads } = await safeGet(`${NFT_URL}/api/nft/mine`, authHeader, 'nft-service:mine');
    const { data: orders } = await safeGet(`${PAYMENT_URL}/api/orders/mine`, authHeader, 'payment-service:mine');

    const uploadsList = uploads || [];
    const ordersList = orders || [];
    const paidOrders = ordersList.filter(o => o.status === 'paid');
    const isCreator = user.role === 'creator' && (user.isSubscribed ?? true);
    const isBuyer = paidOrders.length > 0;

    res.json({
      user,
      flags: { isCreator, isBuyer },
      stats: {
        uploadsCount: uploadsList.length,
        ordersCount: ordersList.length,
        paidOrdersCount: paidOrders.length
      },
      uploads: uploadsList,
      orders: ordersList
    });
  } catch (err) {
    console.error('BFF /api/me unexpected error:', err.message);
    res.status(500).json({ message: 'failed to build profile' });
  }
};
