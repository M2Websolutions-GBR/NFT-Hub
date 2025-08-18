import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import routes from './routes/index.js';
import meRoutes from "./routes/me.routes.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
app.use(meRoutes);

app.get('/health', (_req, res) => res.json({ ok: true }));

app.use('/', routes);

const PORT = process.env.PORT || 3010;
app.listen(PORT, () => console.log(`gateway-bff running on ${PORT}`));
