import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  nftId: { type: String, required: true },
  buyerId: { type: String, required: true },
  stripeSessionId: { type: String, required: true },
  amount: { type: Number, required: true },
  status: { type: String, default: 'pending' }, // pending, paid, failed
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Order', orderSchema);
