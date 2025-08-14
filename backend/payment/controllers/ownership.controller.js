import Order from '../models/order.model.js';

export const checkNFTOwnership = async (req, res) => {
  const { nftId, userId } = req.params;

  try {
    console.log('🔍 Checking ownership for NFT:', nftId, 'by user:', userId);
    const order = await Order.findOne({
      nftId,
      buyerId: userId,
      status: 'paid'
    });
    console.log('➡️ Found order:', order);

    if (order) {
      return res.status(200).json({ isOwner: true });
    } else {
      return res.status(200).json({ isOwner: false });
    }
  } catch (error) {
    console.error('Error checking ownership:', error.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};
