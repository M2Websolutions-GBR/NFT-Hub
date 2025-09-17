import Order from '../models/order.model.js';

export const getMyOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const orders = await Order.find({ buyerId: userId }).sort({ createdAt: -1 });
    res.status(200).json(orders);
  } catch (err) {
    console.error('Error fetching user orders:', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getAllOrders = async (req, res) => {
  try {
    const { q = "", limit = 50, page = 1 } = req.query;

    const filter = {};
    if (q) {
      filter.$or = [
        { nftId: { $regex: q, $options: "i" } },
        { buyerId: { $regex: q, $options: "i" } },
        { stripeSessionId: { $regex: q, $options: "i" } },
        { status: { $regex: q, $options: "i" } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [items, total] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Order.countDocuments(filter),
    ]);

    res.json({
      items,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    });
  } catch (err) {
    console.error("[getAllOrders] error:", err.message);
    res.status(500).json({ message: "Failed to fetch orders" });
  }
};

export const getMyOrdersAsCreator = async (req, res) => {
  try {
    // kommt vom BFF (JWT -> user.id), alternativ direkt, wenn ihr den payment-service separat testet
   const creatorId =
  req.user?.id ||
  req.headers["x-user-id"] ||
  req.query.creatorId; // ⬅️ Fallback über Query erlauben

if (!creatorId) return res.status(401).json({ message: "Unauthorized: missing creator id" });

    const { status = "paid", limit = 50, page = 1, q = "" } = req.query;


    
    const filter = { creatorId };
    if (status !== "all") filter.status = status;

    if (q) {
      filter.$or = [
        { nftId: { $regex: q, $options: "i" } },
        { buyerId: { $regex: q, $options: "i" } },
        { stripeSessionId: { $regex: q, $options: "i" } },
        { status: { $regex: q, $options: "i" } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [items, total] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .select({
          _id: 1,
          creatorId: 1,
          nftId: 1,
          buyerId: 1,
          amountCents: 1,      // passt ggf. auf euer Feld an (price/amount)
          currency: 1,
          status: 1,
          createdAt: 1,
          stripeSessionId: 1,
          // buyerEmail o.ä. nur, wenn DSGVO-seitig ok:
          buyerEmail: 1,
        }),
      Order.countDocuments(filter),
    ]);

    // Normalisiertes DTO (einheitlich fürs Frontend)
    const mapped = items.map(o => ({
      id: String(o._id),
      nftId: String(o.nftId),
      buyerId: o.buyerId,
      price: o.amountCents,          // ggf. umbenennen, wenn euer Feld anders heißt
      currency: o.currency || "eur",
      status: o.status,
      createdAt: o.createdAt,
      stripeSessionId: o.stripeSessionId,
      buyerEmail: o.buyerEmail,
      creatorId: o.creatorId,
    }));

    res.json({
      items: mapped,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    });
  } catch (err) {
    console.error("[getMyOrdersAsCreator] error:", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getOrderBySession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const order = await Order.findOne({ stripeSessionId: sessionId });
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json(order);
  } catch (e) {
    console.error("[getOrderBySession] error:", e.message);
    res.status(500).json({ message: "Failed to fetch order" });
  }
};

export const refundOrder = async (req, res) => {
  const { id } = req.params;
  const { reason = "" } = req.body || {};
  console.log("[refundOrder] id:", id, "reason:", reason);

  try {
    // TODO: Echten Stripe-Refund ausführen, falls verfügbar (payment_intent/charge benötigt)
    const update = {
      status: "refunded",
      ...(Order.schema.path("refundedAt") ? { refundedAt: new Date() } : {}),
      ...(Order.schema.path("refundReason") ? { refundReason: reason } : {}),
    };

    const doc = await Order.findByIdAndUpdate(id, { $set: update }, { new: true });
    if (!doc) return res.status(404).json({ message: "Order not found" });

    res.json(doc);
  } catch (err) {
    console.error("[refundOrder] error:", err.message);
    res.status(500).json({ message: "Failed to refund order" });
  }
};

// PATCH /api/orders/:id/void
export const voidOrder = async (req, res) => {
  const { id } = req.params;
  const { reason = "" } = req.body || {};
  console.log("[voidOrder] id:", id, "reason:", reason);

  try {
    // TODO: Echte Void/Cancel beim PSP, wenn möglich
    const update = {
      status: "void",
      ...(Order.schema.path("voidedAt") ? { voidedAt: new Date() } : {}),
      ...(Order.schema.path("voidReason") ? { voidReason: reason } : {}),
    };

    const doc = await Order.findByIdAndUpdate(id, { $set: update }, { new: true });
    if (!doc) return res.status(404).json({ message: "Order not found" });

    res.json(doc);
  } catch (err) {
    console.error("[voidOrder] error:", err.message);
    res.status(500).json({ message: "Failed to void order" });
  }
};