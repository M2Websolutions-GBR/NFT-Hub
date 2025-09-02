// payment-service/models/order.model.js
import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  nftId: { type: String, required: true },
  buyerId: { type: String, required: true },
  stripeSessionId: { type: String, required: true },
  amount: { type: Number, required: true },
  status: { type: String, default: 'pending' }, // pending, paid, failed, refunded, void
  createdAt: { type: Date, default: Date.now },

  // OPTIONAL: Admin-Aktionen dokumentieren
  refundedAt: { type: Date },
  refundReason: { type: String },
  voidedAt: { type: Date },
  voidReason: { type: String },
});

export default mongoose.model("Order", orderSchema);
