// ============================================================
// Medicine Controller – public browsing & seller management
// ============================================================

import { Response } from "express";
import prisma from "../config/db";
import ApiError from "../utils/ApiError";
import ApiResponse from "../utils/ApiResponse";
import asyncHandler from "../utils/asyncHandler";
import { getPaginationParams, buildPaginationMeta } from "../utils/paginate";
import { AuthRequest, MedicineFilterQuery } from "../types/index";

// ─── GET /api/medicines ───────────────────────────────────────
export const getAllMedicines = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { search, categoryId, minPrice, maxPrice, manufacturer, page, limit } =
    req.query as MedicineFilterQuery;

  const { skip, take, page: pg, limit: lm } = getPaginationParams(page, limit);

  // Build dynamic where clause
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: Record<string, any> = { isAvailable: true };

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { manufacturer: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  if (categoryId) where.categoryId = categoryId;

  if (manufacturer) {
    where.manufacturer = { contains: manufacturer, mode: "insensitive" };
  }

  if (minPrice || maxPrice) {
    where.price = {
      ...(minPrice ? { gte: parseFloat(minPrice) } : {}),
      ...(maxPrice ? { lte: parseFloat(maxPrice) } : {}),
    };
  }

  const [medicines, total] = await Promise.all([
    prisma.medicine.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        stock: true,
        manufacturer: true,
        imageUrl: true,
        isAvailable: true,
        createdAt: true,
        category: { select: { id: true, name: true } },
        seller: { select: { id: true, name: true } },
        reviews: { select: { rating: true } },
      },
    }),
    prisma.medicine.count({ where }),
  ]);

  const data = medicines.map((m: typeof medicines[number]) => {
    const { reviews, ...rest } = m;
    const averageRating =
      reviews.length > 0
        ? parseFloat(
            (reviews.reduce((acc: number, r: { rating: number }) => acc + r.rating, 0) / reviews.length).toFixed(1)
          )
        : null;
    return { ...rest, averageRating, totalReviews: reviews.length };
  });

  ApiResponse.success(res, "Medicines fetched successfully", {
    medicines: data,
    pagination: buildPaginationMeta(total, pg, lm),
  });
});

// ─── GET /api/medicines/:id ───────────────────────────────────
export const getMedicineById = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const id = req.params["id"] as string;

  const medicine = await prisma.medicine.findUnique({
    where: { id },
    include: {
      category: { select: { id: true, name: true } },
      seller: { select: { id: true, name: true, phone: true } },
      reviews: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          rating: true,
          comment: true,
          createdAt: true,
          customer: { select: { id: true, name: true } },
        },
      },
    },
  });

  if (!medicine) throw ApiError.notFound("Medicine not found");

  const averageRating =
    medicine.reviews.length > 0
      ? parseFloat(
          (
            medicine.reviews.reduce((a: number, r: { rating: number }) => a + r.rating, 0) /
            medicine.reviews.length
          ).toFixed(1)
        )
      : null;

  ApiResponse.success(res, "Medicine fetched successfully", {
    ...medicine,
    averageRating,
    totalReviews: medicine.reviews.length,
  });
});

// ─── POST /api/seller/medicines ───────────────────────────────
export const createMedicine = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { name, description, price, stock, manufacturer, imageUrl, categoryId, isAvailable } =
    req.body as {
      name: string;
      description?: string;
      price: number;
      stock: number;
      manufacturer?: string;
      imageUrl?: string;
      categoryId: string;
      isAvailable?: boolean;
    };

  const categoryExists = await prisma.category.findUnique({ where: { id: categoryId } });
  if (!categoryExists) throw ApiError.notFound("Category not found");

  const medicine = await prisma.medicine.create({
    data: {
      name,
      description,
      price,
      stock,
      manufacturer,
      imageUrl,
      categoryId,
      sellerId: req.user!.id,
      isAvailable: isAvailable ?? true,
    },
    include: {
      category: { select: { id: true, name: true } },
    },
  });

  ApiResponse.created(res, "Medicine created successfully", medicine);
});

// ─── PUT /api/seller/medicines/:id ───────────────────────────
export const updateMedicine = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const id = req.params["id"] as string;

  const medicine = await prisma.medicine.findUnique({ where: { id } });
  if (!medicine) throw ApiError.notFound("Medicine not found");

  // Sellers can only modify their own; admins can modify any
  if (req.user!.role === "SELLER" && medicine.sellerId !== req.user!.id) {
    throw ApiError.forbidden("You can only update your own medicines");
  }

  const { categoryId, ...rest } = req.body as {
    name?: string;
    description?: string;
    price?: number;
    stock?: number;
    manufacturer?: string;
    imageUrl?: string;
    categoryId?: string;
    isAvailable?: boolean;
  };

  if (categoryId) {
    const categoryExists = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!categoryExists) throw ApiError.notFound("Category not found");
  }

  const updated = await prisma.medicine.update({
    where: { id },
    data: { ...rest, ...(categoryId && { categoryId }) },
    include: { category: { select: { id: true, name: true } } },
  });

  ApiResponse.success(res, "Medicine updated successfully", updated);
});

// ─── DELETE /api/seller/medicines/:id ────────────────────────
export const deleteMedicine = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const id = req.params["id"] as string;

  const medicine = await prisma.medicine.findUnique({ where: { id } });
  if (!medicine) throw ApiError.notFound("Medicine not found");

  if (req.user!.role === "SELLER" && medicine.sellerId !== req.user!.id) {
    throw ApiError.forbidden("You can only delete your own medicines");
  }

  await prisma.medicine.delete({ where: { id } });

  ApiResponse.success(res, "Medicine deleted successfully");
});

// ─── GET /api/seller/medicines ────────────────────────────────
export const getMyMedicines = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { page, limit } = req.query as { page?: string; limit?: string };
  const { skip, take, page: pg, limit: lm } = getPaginationParams(page, limit);

  const where = { sellerId: req.user!.id };

  const [medicines, total] = await Promise.all([
    prisma.medicine.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      include: { category: { select: { id: true, name: true } } },
    }),
    prisma.medicine.count({ where }),
  ]);

  ApiResponse.success(res, "Your medicines fetched successfully", {
    medicines,
    pagination: buildPaginationMeta(total, pg, lm),
  });
});
