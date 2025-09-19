// bff-service/src/routes/creator.routes.js
import { Router } from "express";
import { verifyToken, isCreator } from "../middleware/auth.middleware.js";
import { listCreatorOrders } from "../controllers/creator.controller.js";

const router = Router();

// Basis-Mount im App-Index: app.use("/api", router);
router.get("/creator/orders", verifyToken, isCreator, listCreatorOrders);

export default router;
