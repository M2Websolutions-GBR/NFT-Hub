import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
// import routes from './routes/index.js';
import meRoutes from "./routes/me.routes.js";
import nftRoutes from "./routes/nft.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import PublicRoutes from "./routes/payment.routes.js"
import CreatorRoutes from "./routes/creator.routes.js"

dotenv.config();

const app = express();

// Eine oder mehrere erlaubte Origins aus ENV (Komma-getrennt), sonst Vite-Dev:
const ALLOWED = (process.env.FRONTEND_URL || "http://localhost:5173")
  .split(",")
  .map(s => s.trim());

const corsOptions = {
  origin(origin, cb) {
    if (!origin) return cb(null, true);
    if (ALLOWED.includes(origin)) return cb(null, true);
    return cb(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  exposedHeaders: ["x-request-id"],   // 👈 WICHTIG!
  // allowedHeaders weglassen → 'cors' spiegelt automatisch die vom Browser angefragten Header
};
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));


// (optional für Cookies hinter Proxy)
app.set("trust proxy", 1);

// danach erst JSON & deine Routen
app.use(express.json());
// app.use("/api", routes);

app.use(morgan('dev'));
app.use(meRoutes);
app.use(nftRoutes);
app.use('/api', CreatorRoutes);


app.get('/health', (_req, res) => res.json({ ok: true }));

app.use(PublicRoutes);       // WICHTIG: Router mounten!
app.use("/api/admin", adminRoutes);


// app.use('/', routes);

const PORT = process.env.PORT || 3010;
app.listen(3010, "0.0.0.0", () => console.log("BFF on :3010"));
