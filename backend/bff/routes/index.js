import { Router } from 'express';
import meRoutes from './me.routes.js';
import adminRoutes from './admin.routes.js';

const router = Router();

router.use('/api', meRoutes);
router.use('/api', adminRoutes);


export default router;
