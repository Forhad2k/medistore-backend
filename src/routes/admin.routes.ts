// ============================================================
// Admin Routes – /api/admin/*
// ============================================================

import { Router } from "express";
import {
  getAllUsers,
  getUserById,
  updateUserStatus,
  getDashboardStats,
} from "../controllers/admin.controller";
import {
  createCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/category.controller";
import { getAllOrders } from "../controllers/order.controller";
import authenticate from "../middlewares/authenticate";
import authorize from "../middlewares/authorize";
import validate from "../middlewares/validate";
import { categoryValidator } from "../validators/category.validator";

const router = Router();

// All admin routes require authentication + ADMIN role
router.use(authenticate, authorize("ADMIN"));

// ─── Dashboard ───────────────────────────────────────────────
router.get("/stats", getDashboardStats);

// ─── User Management ─────────────────────────────────────────
router.get("/users", getAllUsers);
router.get("/users/:id", getUserById);
router.patch("/users/:id", updateUserStatus);

// ─── Order Oversight ─────────────────────────────────────────
router.get("/orders", getAllOrders);

// ─── Category Management ─────────────────────────────────────
router.post("/categories", categoryValidator, validate, createCategory);
router.put("/categories/:id", categoryValidator, validate, updateCategory);
router.delete("/categories/:id", deleteCategory);

export default router;
