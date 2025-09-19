import Stripe from 'stripe';
import axios from 'axios';
import Order from '../models/order.model.js';
import dotenv from 'dotenv';
import { createCertificatePDF } from '../utils/generateCertificatePDF.js';
import { sendCertificateEmail } from '../utils/email.js';

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// kleine Axios-Helfer mit Timeout + Soft-Fail
const http = axios.create({ timeout: 8000 });

const log = (...args) => console.log('[stripeWebhook]', ...args);
const warn = (...args) => console.warn('[stripeWebhook]', ...args);
const errlog = (...args) => console.error('[stripeWebhook]', ...args);

// Best Practice: Stripe Webhook braucht *raw* body (in eurer Route sicherstellen!)
// router.post("/webhook", express.raw({ type: 'application/json' }), webhookHandler);

// ⬇️ EINFÜGEN – robuste Titelauflösung für Zertifikate
async function resolveCertificateTitle({ session, nftServiceBase = 'http://nft-service:3002' }) {
  const md = session?.metadata || {};
  // 1) aus metadata (mehrere mögliche Keys erlauben)
  const metaTitle =
    md.title ?? md.nftTitle ?? md.name ?? md.productName ?? null;
  if (metaTitle && String(metaTitle).trim()) {
    return String(metaTitle).trim();
  }

  // 2) aus NFT-Service, falls nftId vorhanden
  const nftId = md.nftId || md.nft_id || md.id;
  if (nftId) {
    try {
      const { data } = await http.get(`${nftServiceBase}/api/nft/${nftId}`, { timeout: 8000 });
      const name = data?.title ?? data?.name ?? data?.metadata?.name;
      if (name && String(name).trim()) return String(name).trim();
    } catch (e) {
      warn('[resolveCertificateTitle] nft fetch failed:', e?.response?.status, e?.message);
    }
  }

  // 3) aus Stripe line_items (Produktname)
  try {
    // sichergehen, dass wir die Produktnamen haben (falls nicht expanded):
    const sessionFull = session?.line_items?.data?.length
      ? session
      : await stripe.checkout.sessions.retrieve(session.id, {
        expand: ['line_items.data.price.product'],
      });

    const items = sessionFull?.line_items?.data || [];
    for (const it of items) {
      const pName =
        it?.price?.product?.name ??
        it?.description ??
        it?.price?.nickname;
      if (pName && String(pName).trim()) return String(pName).trim();
    }
  } catch (e) {
    warn('[resolveCertificateTitle] stripe items failed:', e.message);
  }

  // 4) Fallback
  return nftId ? `NFT #${nftId}` : 'Unnamed NFT';
}


export const webhookHandler = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body, // RAW!
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    errlog('Signature error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  log('event received:', { id: event.id, type: event.type });

  // Helper: Order via sessionId upsert/aktualisieren
  const upsertOrderFromSession = async (session, patch = {}) => {
    const sessionId = session.id;
    const meta = session.metadata || {};
    const amount = typeof session.amount_total === 'number'
      ? Number((session.amount_total / 100).toFixed(2)) // € aus Cents
      : undefined;

    // Versuchen, bestehende Order zu finden
    let order = await Order.findOne({ stripeSessionId: sessionId });

    if (!order) {
      // Falls Order vor Checkout noch nicht angelegt war (oder Replay) → neu erstellen
      order = new Order({
        nftId: meta.nftId,
        buyerId: meta.buyerId,
        stripeSessionId: sessionId,
        amount: amount ?? 0,
        status: 'pending',
      });
    }

    // Patch anwenden
    Object.assign(order, patch);

    await order.save();
    return order;
  };

  try {
    switch (event.type) {
      /* ============================
       *  1) ONE-TIME PAYMENT FLOW
       * ============================ */
      case 'checkout.session.completed': {
        const session = event.data.object;
        const { nftId, buyerId, title } = session.metadata || {};
        log('checkout.session.completed', { sessionId: session.id, mode: session.mode, nftId, buyerId });

        if (session.mode === 'payment') {
          // Order paid
          const order = await upsertOrderFromSession(session, { status: 'paid' });
          log('order marked paid:', { orderId: order?._id });

          // NFT soldCount++ (Soft-Fail, blockiert den Webhook nicht)
          if (nftId) {
            try {
              await http.patch(`http://nft-service:3002/api/nft/sold/${nftId}`);
              log(`NFT ${nftId} soldCount++`);
            } catch (e) {
              warn('nft sold++ failed:', e?.response?.status, e?.response?.data || e.message);
            }
          }

          // Käuferdaten holen (Soft-Fail)
          let username = 'Buyer', email = null;
          if (buyerId) {
            try {
              const userResponse = await http.get(`http://server-auth:3001/api/auth/user/${buyerId}`);
              username = userResponse.data?.username || userResponse.data?.email || 'Buyer';
              email = userResponse.data?.email;
              log('buyer loaded:', { buyerId, username, email });
            } catch (e) {
              warn('buyer lookup failed:', e?.response?.status, e?.response?.data || e.message);
            }
          }

          // Zertifikat erzeugen & E-Mail senden (Soft-Fail)
          try {
            const certTitle = await resolveCertificateTitle({ session });

            const pdfPath = await createCertificatePDF({
              username,
              title: certTitle, // <-- NICHT mehr 'title || ...'
              nftId,
            });
            log('certificate generated:', pdfPath);

            if (email) {
              await sendCertificateEmail({
                to: email,
                username,
                title: certTitle, // <-- gleicher Titel auch in der Mail
                filePath: pdfPath,
              });
              log(`certificate sent to ${email}`);
            } else {
              warn('no email available to send certificate');
            }
          } catch (e) {
            warn('certificate/email failed:', e.message);
          }
        }

        if (session.mode === 'subscription') {
          const userId = session.metadata?.userId;
          log('subscription completed for user:', userId);

          if (userId) {
            try {
              const newExpiration = new Date();
              newExpiration.setDate(newExpiration.getDate() + 30);

              await http.patch(`http://server-auth:3001/api/auth/renew-subscription/${userId}`, {
                subscriptionExpires: newExpiration,
              });

              log('subscription extended until', newExpiration.toISOString());
            } catch (e) {
              warn('subscription renew failed:', e?.response?.status, e?.response?.data || e.message);
            }
          } else {
            warn('subscription completed but no userId in metadata');
          }
        }

        // Stripe erwartet schnelle 200 – alles erledigt
        return res.status(200).json({ received: true });
      }

      // Session wurde nicht bezahlt und ist abgelaufen
      case 'checkout.session.expired': {
        const session = event.data.object;
        log('checkout.session.expired', { sessionId: session.id });

        await upsertOrderFromSession(session, { status: 'failed' });
        return res.status(200).json({ received: true });
      }

      // async payment (SEPA etc.) schlug fehl
      case 'checkout.session.async_payment_failed': {
        const session = event.data.object;
        log('checkout.session.async_payment_failed', { sessionId: session.id });

        await upsertOrderFromSession(session, { status: 'failed' });
        return res.status(200).json({ received: true });
      }

      /* ============================
       *  2) SUBSCRIPTION BILLING
       * ============================ */
      case 'invoice.payment_succeeded': {
        // wiederkehrende Abozahlung erfolgreich
        const invoice = event.data.object;
        const customerId = invoice.customer;
        log('invoice.payment_succeeded', { customerId, invoiceId: invoice.id });

        // Wenn ihr mapping userId <-> stripeCustomerId habt, könnte man hier erneut verlängern
        // (optional; euer flow nutzt renew über checkout.session.completed bereits)
        return res.status(200).json({ received: true });
      }

      /* ============================
       *  3) REFUNDS/CHARGEBACKS
       * ============================ */
      case 'charge.refunded': {
        const charge = event.data.object;
        const paymentIntentId = charge.payment_intent;
        log('charge.refunded', { chargeId: charge.id, paymentIntentId });

        // Optional: Session via PaymentIntent herausfinden
        // Stripe: PI -> Session Mapping kann man über expand / search lösen,
        // hier fallback: markiere Orders auf "refunded", die pi/charge kennen (wenn gespeichert)
        const order = await Order.findOneAndUpdate(
          { /* bei euch gibt's kein PI-Feld – ggf. stripeSessionId aus metadata mappen */ },
          { $set: { status: 'refunded', refundReason: charge.reason || 'refund' } },
          { new: true }
        );

        if (!order) {
          warn('no order matched for refund (consider storing PI/charge on order)');
        }

        return res.status(200).json({ received: true });
      }

      default:
        // Unhandled Events sauber bestätigen (Stripe will 2xx)
        log('unhandled event type:', event.type);
        return res.status(200).send('Unhandled event type');
    }
  } catch (error) {
    errlog('handler error:', error.message);
    // 5xx → Stripe schickt Event erneut (gut bei kurzzeitigen Ausfällen)
    return res.status(500).json({ message: 'Webhook handling failed' });
  }
};
