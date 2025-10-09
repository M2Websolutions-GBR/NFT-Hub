import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';

// eure bestehenden Router-Imports (NICHT geändert)
import meRoutes from "./routes/me.routes.js";
import nftRoutes from "./routes/nft.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import PublicRoutes from "./routes/payment.routes.js";
import CreatorRoutes from "./routes/creator.routes.js";

// wichtig wieder entfernen
import listEndpoints from "express-list-endpoints";

// .env wie von euch angegeben
dotenv.config({ path: "./config/.env" });

const app = express();

// CORS wie gehabt
const ALLOWED = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean)
  .map(s => {
    try {
      return new URL(s).origin; // normalisiert (inkl. Port)
    } catch {
      return s.replace(/\/+$/, '');
    }
  });

const corsOptions = {
  origin(origin, cb) {
    if (!origin) return cb(null, true); // z.B. Postman, server-to-server
    try {
      const norm = new URL(origin).origin;
      if (ALLOWED.includes(norm)) return cb(null, true);

      // Dev-Wildcard: localhost/127.0.0.1
      if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(norm)) return cb(null, true);

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

// Proxy-Setup & Basics
app.set("trust proxy", 1);
app.use(express.json());
app.use(morgan('dev'));

// ⚠️ WICHTIG: Alles konsistent unter /api mounten, Reihenfolge bewusst
app.use('/api', meRoutes);
app.use('/api', nftRoutes);
app.use('/api', CreatorRoutes);
app.use('/api', PublicRoutes);
app.use('/api/admin', adminRoutes);

app.get("/health", (_req, res) => res.json({ ok: true }));

import listEndpoints from "express-list-endpoints";

app.get("/__routes", (_req, res) => res.json(listEndpoints(app)));
// Optional: registrierte Endpoints listen (nur für Debug; nicht in Prod offen lassen)
try {
  // Nur laden, wenn verfügbar – verhindert Crash ohne Dependency
  const { default: listEndpoints } = await import("express-list-endpoints").catch(() => ({ default: null }));
  if (listEndpoints) {
    app.get("/__routes", (_req, res) => res.json(listEndpoints(app)));
  }
} catch { /* noop */ }

// Start
const PORT = process.env.PORT || 3010;
app.listen(3010, "0.0.0.0", () => console.log("BFF on :3010"));
