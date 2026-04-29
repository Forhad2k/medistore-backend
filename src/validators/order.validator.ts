// ============================================================
// Order Validators
// ============================================================

import { body } from "express-validator";

export const createOrderValidator = [
  body("shippingAddress")
    .trim()
    .notEmpty().withMessage("Shipping address is required")
    .isLength({ max: 500 }).withMessage("Address must not exceed 500 characters"),

  body("shippingPhone")
    .trim()
    .notEmpty().withMessage("Shipping phone is required")
    .isMobilePhone("any").withMessage("Must be a valid phone number"),

  body("note")
    .optional()
    .trim()
    .isLength({ max: 300 }).withMessage("Note must not exceed 300 characters"),

  body("items")
    .isArray({ min: 1 }).withMessage("Order must contain at least one item"),

  body("items.*.medicineId")
    .trim()
    .notEmpty().withMessage("Each item must have a valid medicineId"),

  body("items.*.quantity")
    .isInt({ min: 1 }).withMessage("Each item quantity must be at least 1"),
];

export const updateOrderStatusValidator = [
  body("status")
    .notEmpty().withMessage("Status is required")
    .isIn(["PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"])
    .withMessage("Invalid status value"),
];
