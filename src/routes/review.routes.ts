// ============================================================
// Review Routes – /api/reviews/*
// ============================================================

import { Router } from "express";
import { deleteReview } from "../controllers/review.controller";
import authenticate from "../middlewares/authenticate";
import authorize from "../middlewares/authorize";

const router = Router();

router.delete("/:id", authenticate, authorize("CUSTOMER"), deleteReview);

export default router;
