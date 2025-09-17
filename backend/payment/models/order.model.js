import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    nftId: { type: String, required: true, index: true },
    buyerId: { type: String, required: true, index: true },
    stripeSessionId: { type: String, required: true, unique: true, index: true },

    // DB-Feld bleibt 'amount' — wir geben einen Alias 'amountCents' drauf
    amount: { type: Number, required: true, min: 0, alias: "amountCents" },

    currency: { type: String, default: "eur", lowercase: true }, // <- neu

    status: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded", "void"],
      default: "pending",
      index: true,
    },
    createdAt: { type: Date, default: Date.now, index: true },

    // OPTIONAL: Admin-Aktionen dokumentieren
    refundedAt: { type: Date },
    refundReason: { type: String },
    voidedAt: { type: Date },
    voidReason: { type: String },
  },
  {
    timestamps: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    versionKey: false,
    strict: true,
  }
);

// optional: Sicherstellen, dass currency immer gesetzt wird
orderSchema.pre("save", function (next) {
  if (!this.currency) this.currency = "eur";
  next();
});

export default mongoose.model("Order", orderSchema);
