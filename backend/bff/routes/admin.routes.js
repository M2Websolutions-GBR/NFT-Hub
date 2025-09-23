// routes/admin.routes.js
import { Router } from "express";
import * as adminController from "../controllers/admin.controller.js";
import { verifyToken, isAdmin } from "../middleware/auth.middleware.js";

const router = Router();

router.use((req, _res, next) => {
  console.log(`\n[admin.routes] ${req.method} ${req.originalUrl}`);
  next();
});

// Reihenfolge: verifyToken -> isAdmin -> Controller
router.get("/summary", verifyToken, isAdmin, adminController.getAdminSummary);

// NFTs
router.get("/nft", verifyToken, isAdmin, adminController.listNfts);
router.patch("/nft/:id/block", verifyToken, isAdmin, adminController.blockNft);
router.patch("/nft/:id/unblock", verifyToken, isAdmin, adminController.unblockNft);

// Users
router.get("/user", verifyToken, isAdmin, adminController.listUsers);
router.patch("/user/:id/suspend", verifyToken, isAdmin, adminController.suspendUser);
router.patch("/user/:id/unsuspend", verifyToken, isAdmin, adminController.unsuspendUser);

// Orders
router.get("/orders", verifyToken, isAdmin, adminController.listOrders);
router.post("/orders/:id/refund", verifyToken, isAdmin, adminController.refundOrder);
router.post("/orders/:id/void", verifyToken, isAdmin, adminController.voidOrder);

export default router;
