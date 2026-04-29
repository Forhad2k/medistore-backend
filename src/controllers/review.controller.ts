// ============================================================
// Review Controller
// ============================================================

import { Response } from "express";
import prisma from "../config/db";
import ApiError from "../utils/ApiError";
import ApiResponse from "../utils/ApiResponse";
import asyncHandler from "../utils/asyncHandler";
import { AuthRequest } from "../types/index";

// ─── POST /api/medicines/:id/reviews ─────────────────────────
export const createReview = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { id: medicineId } = req.params as { id: string };
  const { rating, comment } = req.body as { rating: number; comment?: string };
  const customerId = req.user!.id;

  const medicine = await prisma.medicine.findUnique({ where: { id: medicineId } });
  if (!medicine) throw ApiError.notFound("Medicine not found");

  // Must have a delivered order containing this medicine
  const hasOrdered = await prisma.orderItem.findFirst({
    where: {
      medicineId,
      order: { customerId, status: "DELIVERED" },
    },
  });

  if (!hasOrdered) {
    throw ApiError.forbidden("You can only review medicines from delivered orders");
  }

  const existing = await prisma.review.findUnique({
    where: { customerId_medicineId: { customerId, medicineId } },
  });
  if (existing) throw ApiError.conflict("You have already reviewed this medicine");

  const review = await prisma.review.create({
    data: { rating, comment, customerId, medicineId },
    include: { customer: { select: { id: true, name: true } } },
  });

  ApiResponse.created(res, "Review submitted successfully", review);
});

// ─── GET /api/medicines/:id/reviews ──────────────────────────
export const getMedicineReviews = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { id: medicineId } = req.params as { id: string };

  const medicine = await prisma.medicine.findUnique({ where: { id: medicineId } });
  if (!medicine) throw ApiError.notFound("Medicine not found");

  const reviews = await prisma.review.findMany({
    where: { medicineId },
    orderBy: { createdAt: "desc" },
    include: { customer: { select: { id: true, name: true } } },
  });

  const averageRating =
    reviews.length > 0
      ? parseFloat(
          (
            reviews.reduce((a: number, r: { rating: number }) => a + r.rating, 0) / reviews.length
          ).toFixed(1)
        )
      : null;

  ApiResponse.success(res, "Reviews fetched successfully", {
    reviews,
    averageRating,
    totalReviews: reviews.length,
  });
});

// ─── DELETE /api/reviews/:id ──────────────────────────────────
export const deleteReview = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const id = req.params["id"] as string;

  const review = await prisma.review.findUnique({ where: { id } });
  if (!review) throw ApiError.notFound("Review not found");

  if (review.customerId !== req.user!.id) {
    throw ApiError.forbidden("You can only delete your own reviews");
  }

  await prisma.review.delete({ where: { id } });

  ApiResponse.success(res, "Review deleted successfully");
});
