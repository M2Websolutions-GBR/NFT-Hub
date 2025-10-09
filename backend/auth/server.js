import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes.js';
import DBconnection from './config/db.js';

dotenv.config({path:"./config/.env"});

const app = express();

// Eine oder mehrere erlaubte Origins aus ENV (Komma-getrennt), sonst Vite-Dev:
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

      // Dev-Wildcard: localhost/127.0.0.1 (falls du das nicht willst, Zeile entfernen)
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
// Falls du die OPTIONS-Route explizit behalten willst (sonst Zeile auslassen):
// app.options('/:path(*)', cors(corsOptions));

const PORT = process.env.PORT || 3001;

DBconnection();

app.use(express.json());

app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
  res.send('Auth Service running with MongoDB');
});

app.listen(PORT, () => {
  console.log(`Auth Service listening on port ${PORT}`);
});
