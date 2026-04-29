// ============================================================
// Order Routes – /api/orders/*  (Customer)
// ============================================================

import { Router } from "express";
import {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
} from "../controllers/order.controller";
import authenticate from "../middlewares/authenticate";
import authorize from "../middlewares/authorize";
import validate from "../middlewares/validate";
import {
  createOrderValidator,
} from "../validators/order.validator";

const router = Router();

// All order routes require authentication
router.use(authenticate);

router.post("/", authorize("CUSTOMER"), createOrderValidator, validate, createOrder);
router.get("/", authorize("CUSTOMER"), getMyOrders);
router.get("/:id", getOrderById);  // customer, seller, admin
router.patch("/:id/cancel", authorize("CUSTOMER"), cancelOrder);

export default router;
