// ============================================================
// Auth Routes
// ============================================================

import { Router } from "express";
import {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
} from "../controllers/auth.controller";
import authenticate from "../middlewares/authenticate";
import validate from "../middlewares/validate";
import { registerValidator, loginValidator } from "../validators/auth.validator";
import { body } from "express-validator";

const router = Router();

// Public
router.post("/register", registerValidator, validate, register);
router.post("/login", loginValidator, validate, login);

// Protected
router.get("/me", authenticate, getMe);
router.patch("/profile", authenticate, updateProfile);
router.patch(
  "/change-password",
  authenticate,
  [
    body("currentPassword").notEmpty().withMessage("Current password is required"),
    body("newPassword")
      .notEmpty()
      .isLength({ min: 6 })
      .withMessage("New password must be at least 6 characters"),
  ],
  validate,
  changePassword
);

export default router;
