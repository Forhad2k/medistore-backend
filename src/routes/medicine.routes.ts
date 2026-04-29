// ============================================================
// Medicine Routes – Public + Seller
// ============================================================

import { Router } from "express";
import {
  getAllMedicines,
  getMedicineById,
  createMedicine,
  updateMedicine,
  deleteMedicine,
  getMyMedicines,
} from "../controllers/medicine.controller";
import { createReview, getMedicineReviews } from "../controllers/review.controller";
import authenticate from "../middlewares/authenticate";
import authorize from "../middlewares/authorize";
import validate from "../middlewares/validate";
import {
  createMedicineValidator,
  updateMedicineValidator,
} from "../validators/medicine.validator";
import { createReviewValidator } from "../validators/review.validator";

const router = Router();

// ─── Public ──────────────────────────────────────────────────
router.get("/", getAllMedicines);
router.get("/:id", getMedicineById);
router.get("/:id/reviews", getMedicineReviews);

// ─── Customer: leave a review ────────────────────────────────
router.post(
  "/:id/reviews",
  authenticate,
  authorize("CUSTOMER"),
  createReviewValidator,
  validate,
  createReview
);

export default router;
