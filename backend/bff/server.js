import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
// import routes from './routes/index.js';
import meRoutes from "./routes/me.routes.js";
import nftRoutes from "./routes/nft.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import PublicRoutes from "./routes/payment.routes.js"

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
app.use(meRoutes);
app.use(nftRoutes);


app.get('/health', (_req, res) => res.json({ ok: true }));

app.use(PublicRoutes);       // WICHTIG: Router mounten!
app.use("/api/admin", adminRoutes);


// app.use('/', routes);

const PORT = process.env.PORT || 3010;
app.listen(3010, "0.0.0.0", () => console.log("BFF on :3010"));
