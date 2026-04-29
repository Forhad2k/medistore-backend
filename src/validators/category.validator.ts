// ============================================================
// Category Validators
// ============================================================

import { body } from "express-validator";

export const categoryValidator = [
  body("name")
    .trim()
    .notEmpty().withMessage("Category name is required")
    .isLength({ max: 100 }).withMessage("Name must not exceed 100 characters"),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 300 }).withMessage("Description must not exceed 300 characters"),
];
