import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import DBconnection from './config/db.js';
import paymentRoutes from './routes/payment.routes.js';
// import orderRoutes from './routes/order.routes.js'; // deine API-Routen
// import { webhookHandler } from './controllers/webhook.controller.js'; // gleich unten
import Stripe from 'stripe';
import ownershipRoutes from './routes/ownership.routes.js';
import orderRoutes from './routes/order.routes.js';
import webhookroutes from './routes/webhook.routes.js';


dotenv.config();

const app = express();

// Health endpoint für Docker/NGINX Checks
app.get('/health', (req, res) => {
  res.status(200).send('OK - payment');
});

// DEBUG-INSTRUMENTATION (nur kurzfristig aktiv lassen!)
function isPlainPath(x) {
  return typeof x === 'string';
}

const _use = app.use.bind(app);
app.use = function (...args) {
  try {
    return _use(...args);
  } catch (e) {
    console.error('[ROUTE-CRASH in app.use] arg0=', args[0]);
    throw e;
  }
};

['get','post','put','patch','delete','options','all'].forEach(m => {
  const _m = app[m].bind(app);
  app[m] = function (...args) {
    try {
      return _m(...args);
    } catch (e) {
      console.error(`[ROUTE-CRASH in app.${m}] arg0=`, args[0]);
      throw e;
    }
  };
});
// Eine oder mehrere erlaubte Origins aus ENV (Komma-getrennt), sonst Vite-Dev:
const ALLOWED = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean)
  .map(s => {
    try {
      return new URL(s).origin; // normalisiert inkl. Port
    } catch {
      return s.replace(/\/+$/, '');
    }
  });

// Regex: erlaube Dev-IPs (localhost, 127.*, 10.*, 172.16–31.*, 192.168.*)
const DEV_IP_ORIGIN = /^https?:\/\/((localhost|127\.\d+\.\d+\.\d+)|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+|192\.168\.\d+\.\d+)(:\d+)?$/;

const corsOptions = {
  origin(origin, cb) {
    if (!origin) return cb(null, true); // Postman/SSR
    try {
      const norm = new URL(origin).origin;
      if (ALLOWED.includes(norm)) return cb(null, true);
      if (DEV_IP_ORIGIN.test(norm)) return cb(null, true); // Dev-Freigabe für lokale IPs
      console.warn('[CORS BLOCKED]', { origin, ALLOWED });
      return cb(new Error('Not allowed by CORS'));
    } catch {
      console.warn('[CORS INVALID ORIGIN HEADER]', origin);
      return cb(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  exposedHeaders: ['x-request-id'],
};

app.use(cors(corsOptions));
// app.options('/(.*)', cors(corsOptions));


const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const PORT = process.env.PORT || 3003;

DBconnection();

// Nur für Webhook-Rohdaten (kommt **vor** express.json())
// app.post('/api/webhook/stripe', express.raw({ type: 'application/json' }), );

app.use(webhookroutes);
app.use(express.json()); // wichtig für req.body
app.use('/api/payment', paymentRoutes); // hier wird der Pfad richtig registriert
app.use('/api', ownershipRoutes);
app.use('/api', orderRoutes);


app.listen(PORT, () => {
  console.log(`Payment Service listening on port ${PORT}`);
});
