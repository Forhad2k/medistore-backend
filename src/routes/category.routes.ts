// ============================================================
// Category Routes – /api/categories/*
// ============================================================

import { Router } from "express";
import {
  getAllCategories,
  getCategoryById,
} from "../controllers/category.controller";

const router = Router();

// Public
router.get("/", getAllCategories);
router.get("/:id", getCategoryById);

export default router;
