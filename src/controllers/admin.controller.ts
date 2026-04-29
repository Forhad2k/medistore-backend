// ============================================================
// Admin Controller – user management & dashboard stats
// ============================================================

import { Response } from "express";
import { Prisma, Role } from "@prisma/client";
import prisma from "../config/db";
import ApiError from "../utils/ApiError";
import ApiResponse from "../utils/ApiResponse";
import asyncHandler from "../utils/asyncHandler";
import { getPaginationParams, buildPaginationMeta } from "../utils/paginate";
import { AuthRequest, PaginationQuery } from "../types/index";

interface OrderStatusCount {
  status: string;
  _count: { _all: number };
}

// ─── GET /api/admin/users ─────────────────────────────────────
export const getAllUsers = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { page, limit } = req.query as PaginationQuery;
  const { role, search } = req.query as { role?: Role; search?: string };
  const { skip, take, page: pg, limit: lm } = getPaginationParams(page, limit);

  const where: Prisma.UserWhereInput = {
    // If a specific role is requested use it, otherwise exclude ADMIN
    ...(role
      ? { role }
      : { role: { not: Role.ADMIN } }
    ),
    ...(search && {
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ],
    }),
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        isBanned: true,
        createdAt: true,
        _count: { select: { orders: true, medicines: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  ApiResponse.success(res, "Users fetched successfully", {
    users,
    pagination: buildPaginationMeta(total, pg, lm),
  });
});

// ─── GET /api/admin/users/:id ─────────────────────────────────
export const getUserById = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const id = req.params["id"] as string;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      phone: true,
      address: true,
      isBanned: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { orders: true, medicines: true, reviews: true } },
    },
  });

  if (!user) throw ApiError.notFound("User not found");

  ApiResponse.success(res, "User fetched successfully", user);
});

// ─── PATCH /api/admin/users/:id ───────────────────────────────
export const updateUserStatus = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const id = req.params["id"] as string;
  const { isBanned } = req.body as { isBanned: boolean };

  if (typeof isBanned !== "boolean") {
    throw ApiError.badRequest("isBanned must be a boolean");
  }

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw ApiError.notFound("User not found");

  if (user.role === Role.ADMIN) {
    throw ApiError.forbidden("Cannot ban an admin account");
  }

  const updated = await prisma.user.update({
    where: { id },
    data: { isBanned },
    select: { id: true, name: true, email: true, role: true, isBanned: true },
  });

  const action = isBanned ? "banned" : "unbanned";
  ApiResponse.success(res, `User ${action} successfully`, updated);
});

// ─── GET /api/admin/stats ─────────────────────────────────────
export const getDashboardStats = asyncHandler(async (_req: AuthRequest, res: Response): Promise<void> => {
  const [
    totalCustomers,
    totalSellers,
    totalMedicines,
    totalOrders,
    revenueResult,
    ordersByStatus,
  ] = await Promise.all([
    prisma.user.count({ where: { role: Role.CUSTOMER } }),
    prisma.user.count({ where: { role: Role.SELLER } }),
    prisma.medicine.count(),
    prisma.order.count(),
    prisma.order.aggregate({
      where: { status: { not: "CANCELLED" } },
      _sum: { totalAmount: true },
    }),
    prisma.order.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
  ]);

  ApiResponse.success(res, "Dashboard stats fetched successfully", {
    totalCustomers,
    totalSellers,
    totalMedicines,
    totalOrders,
    totalRevenue: revenueResult._sum.totalAmount ?? 0,
    ordersByStatus: ordersByStatus.map((s: OrderStatusCount) => ({
      status: s.status,
      count: s._count._all,
    })),
  });
});