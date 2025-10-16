// nft-service/src/index.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import DBconnection from './config/db.js';
import nftRoutes from './routes/nft.routes.js';

dotenv.config({path:"./config/.env"});

const app = express();
const PORT = process.env.PORT || 3002;

// === CORS-Konfiguration ===
const ALLOWED_ORIGINS = (process.env.FRONTEND_URL || "http://localhost:5173")
  .split(",")
  .map(s => s.trim());

const corsOptions = {
  origin(origin, cb) {
    if (!origin) return cb(null, true);
    const ok = ALLOWED_ORIGINS.includes(origin);
    if (ok) return cb(null, true);
    return cb(new Error(`Not allowed by CORS: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  exposedHeaders: ["x-request-id"],
};

app.use((req, _res, next) => {
  console.log("[NFT] IN", req.method, req.originalUrl, "Origin:", req.headers.origin || "-");
  next();
});

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));
// === Ende CORS ===

app.use(express.json());
DBconnection();

app.use('/api/nft', nftRoutes);

app.get('/', (req, res) => {
  res.send('NFT Service running with MongoDB');
});

app.listen(PORT, () => {
  console.log(`NFT Service listening on port ${PORT}`);
});
