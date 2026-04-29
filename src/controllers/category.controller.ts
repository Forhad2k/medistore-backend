// ============================================================
// Category Controller – public read | admin CRUD
// ============================================================

import { Response } from "express";
import prisma from "../config/db";
import ApiError from "../utils/ApiError";
import ApiResponse from "../utils/ApiResponse";
import asyncHandler from "../utils/asyncHandler";
import { AuthRequest } from "../types/index";

// ─── GET /api/categories ──────────────────────────────────────
export const getAllCategories = asyncHandler(async (_req: AuthRequest, res: Response): Promise<void> => {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { medicines: true } } },
  });

  ApiResponse.success(res, "Categories fetched successfully", categories);
});

// ─── GET /api/categories/:id ──────────────────────────────────
export const getCategoryById = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const id = req.params["id"] as string;

  const category = await prisma.category.findUnique({
    where: { id },
    include: { _count: { select: { medicines: true } } },
  });

  if (!category) throw ApiError.notFound("Category not found");

  ApiResponse.success(res, "Category fetched successfully", category);
});

// ─── POST /api/admin/categories ───────────────────────────────
export const createCategory = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { name, description } = req.body as { name: string; description?: string };

  const existing = await prisma.category.findUnique({ where: { name } });
  if (existing) throw ApiError.conflict(`Category "${name}" already exists`);

  const category = await prisma.category.create({ data: { name, description } });

  ApiResponse.created(res, "Category created successfully", category);
});

// ─── PUT /api/admin/categories/:id ───────────────────────────
export const updateCategory = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const id = req.params["id"] as string;
  const { name, description } = req.body as { name?: string; description?: string };

  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) throw ApiError.notFound("Category not found");

  if (name && name !== category.name) {
    const nameTaken = await prisma.category.findUnique({ where: { name } });
    if (nameTaken) throw ApiError.conflict(`Category "${name}" already exists`);
  }

  const updated = await prisma.category.update({
    where: { id },
    data: { name, description },
  });

  ApiResponse.success(res, "Category updated successfully", updated);
});

// ─── DELETE /api/admin/categories/:id ────────────────────────
export const deleteCategory = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const id = req.params["id"] as string;

  const category = await prisma.category.findUnique({
    where: { id },
    include: { _count: { select: { medicines: true } } },
  });

  if (!category) throw ApiError.notFound("Category not found");

  if (category._count.medicines > 0) {
    throw ApiError.badRequest(
      `Cannot delete category with ${category._count.medicines} associated medicine(s). Reassign them first.`
    );
  }

  await prisma.category.delete({ where: { id } });

  ApiResponse.success(res, "Category deleted successfully");
});
