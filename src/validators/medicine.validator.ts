// ============================================================
// Medicine Validators
// ============================================================

import { body } from "express-validator";

export const createMedicineValidator = [
  body("name")
    .trim()
    .notEmpty().withMessage("Medicine name is required")
    .isLength({ max: 200 }).withMessage("Name must not exceed 200 characters"),

  body("price")
    .notEmpty().withMessage("Price is required")
    .isFloat({ min: 0.01 }).withMessage("Price must be a positive number"),

  body("stock")
    .notEmpty().withMessage("Stock is required")
    .isInt({ min: 0 }).withMessage("Stock must be a non-negative integer"),

  body("categoryId")
    .trim()
    .notEmpty().withMessage("Category ID is required"),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage("Description must not exceed 1000 characters"),

  body("manufacturer")
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage("Manufacturer must not exceed 200 characters"),

  body("imageUrl")
    .optional()
    .trim()
    .isURL().withMessage("Image URL must be a valid URL"),
];

export const updateMedicineValidator = [
  body("name")
    .optional()
    .trim()
    .notEmpty().withMessage("Name cannot be empty")
    .isLength({ max: 200 }).withMessage("Name must not exceed 200 characters"),

  body("price")
    .optional()
    .isFloat({ min: 0.01 }).withMessage("Price must be a positive number"),

  body("stock")
    .optional()
    .isInt({ min: 0 }).withMessage("Stock must be a non-negative integer"),

  body("categoryId")
    .optional()
    .trim()
    .notEmpty().withMessage("Category ID cannot be empty"),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage("Description must not exceed 1000 characters"),

  body("imageUrl")
    .optional()
    .trim()
    .isURL().withMessage("Image URL must be a valid URL"),

  body("isAvailable")
    .optional()
    .isBoolean().withMessage("isAvailable must be a boolean"),
];
