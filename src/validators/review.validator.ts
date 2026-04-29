// ============================================================
// Review Validators
// ============================================================

import { body } from "express-validator";

export const createReviewValidator = [
  body("rating")
    .notEmpty().withMessage("Rating is required")
    .isInt({ min: 1, max: 5 }).withMessage("Rating must be an integer between 1 and 5"),

  body("comment")
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage("Comment must not exceed 500 characters"),
];
