// ============================================================
// Seller Routes – /api/seller/*
// ============================================================

import { Router } from "express";
import {
  createMedicine,
  updateMedicine,
  deleteMedicine,
  getMyMedicines,
} from "../controllers/medicine.controller";
import {
  getSellerOrders,
  updateOrderStatus,
} from "../controllers/order.controller";
import authenticate from "../middlewares/authenticate";
import authorize from "../middlewares/authorize";
import validate from "../middlewares/validate";
import {
  createMedicineValidator,
  updateMedicineValidator,
} from "../validators/medicine.validator";
import { updateOrderStatusValidator } from "../validators/order.validator";

const router = Router();

// All seller routes require authentication + SELLER role
router.use(authenticate, authorize("SELLER"));

// ─── Medicine Inventory ───────────────────────────────────────
router.get("/medicines", getMyMedicines);
router.post("/medicines", createMedicineValidator, validate, createMedicine);
router.put("/medicines/:id", updateMedicineValidator, validate, updateMedicine);
router.delete("/medicines/:id", deleteMedicine);

// ─── Order Management ────────────────────────────────────────
router.get("/orders", getSellerOrders);
router.patch("/orders/:id", updateOrderStatusValidator, validate, updateOrderStatus);

export default router;
