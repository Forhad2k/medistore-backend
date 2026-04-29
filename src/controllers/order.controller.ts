// ============================================================
// Order Controller – customer orders & seller management
// ============================================================

import { Response } from "express";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TxClient = any; // Prisma.TransactionClient – typed after prisma generate

import prisma from "../config/db";
import ApiError from "../utils/ApiError";
import ApiResponse from "../utils/ApiResponse";
import asyncHandler from "../utils/asyncHandler";
import { getPaginationParams, buildPaginationMeta } from "../utils/paginate";
import { AuthRequest, PaginationQuery, OrderStatus } from "../types/index";
interface OrderItemInput {
  medicineId: string;
  quantity: number;
}

interface MedicineRecord {
  id: string;
  name: string;
  price: number | { toNumber(): number };
  stock: number;
}

// ─── POST /api/orders ─────────────────────────────────────────
export const createOrder = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { shippingAddress, shippingPhone, note, items } = req.body as {
    shippingAddress: string;
    shippingPhone: string;
    note?: string;
    items: OrderItemInput[];
  };

  const medicineIds = items.map((i) => i.medicineId);
  const medicines = await prisma.medicine.findMany({
    where: { id: { in: medicineIds }, isAvailable: true },
  }) as unknown as MedicineRecord[];

  if (medicines.length !== medicineIds.length) {
    throw ApiError.badRequest("One or more medicines are unavailable or do not exist");
  }

  let totalAmount = 0;
  const orderItemsData = items.map((item) => {
    const medicine = medicines.find((m: MedicineRecord) => m.id === item.medicineId)!;

    if (medicine.stock < item.quantity) {
      throw ApiError.badRequest(
        `Insufficient stock for "${medicine.name}". Available: ${medicine.stock}`
      );
    }

    totalAmount += Number(medicine.price) * item.quantity;

    return {
      medicineId: item.medicineId,
      quantity: item.quantity,
      unitPrice: medicine.price,
    };
  });

  const order = await prisma.$transaction(async (tx: TxClient) => {
    const newOrder = await tx.order.create({
      data: {
        customerId: req.user!.id,
        shippingAddress,
        shippingPhone,
        note,
        totalAmount,
        items: { create: orderItemsData },
      },
      include: {
        items: {
          include: { medicine: { select: { id: true, name: true, imageUrl: true } } },
        },
      },
    });

    await Promise.all(
      items.map((item: OrderItemInput) =>
        tx.medicine.update({
          where: { id: item.medicineId },
          data: { stock: { decrement: item.quantity } },
        })
      )
    );

    return newOrder;
  });

  ApiResponse.created(res, "Order placed successfully", order);
});

// ─── GET /api/orders ──────────────────────────────────────────
export const getMyOrders = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { page, limit } = req.query as PaginationQuery;
  const { skip, take, page: pg, limit: lm } = getPaginationParams(page, limit);

  const where = { customerId: req.user!.id };

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      include: {
        items: {
          include: { medicine: { select: { id: true, name: true, imageUrl: true, price: true } } },
        },
      },
    }),
    prisma.order.count({ where }),
  ]);

  ApiResponse.success(res, "Orders fetched successfully", {
    orders,
    pagination: buildPaginationMeta(total, pg, lm),
  });
});

// ─── GET /api/orders/:id ──────────────────────────────────────
export const getOrderById = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const id = req.params["id"] as string;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      customer: { select: { id: true, name: true, email: true, phone: true } },
      items: {
        include: {
          medicine: { select: { id: true, name: true, imageUrl: true, manufacturer: true } },
        },
      },
    },
  });

  if (!order) throw ApiError.notFound("Order not found");

  if (req.user!.role === "CUSTOMER" && order.customerId !== req.user!.id) {
    throw ApiError.forbidden("Access denied");
  }

  ApiResponse.success(res, "Order fetched successfully", order);
});

// ─── PATCH /api/orders/:id/cancel ────────────────────────────
export const cancelOrder = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const id = req.params["id"] as string;

  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true },
  });

  if (!order) throw ApiError.notFound("Order not found");
  if (order.customerId !== req.user!.id) throw ApiError.forbidden("Access denied");

  if (order.status !== "PLACED") {
    throw ApiError.badRequest(`Cannot cancel an order that is already "${order.status}"`);
  }

  const updated = await prisma.$transaction(async (tx: TxClient) => {
    const cancelled = await tx.order.update({
      where: { id },
      data: { status: "CANCELLED" },
    });

    await Promise.all(
      order.items.map((item: { medicineId: string; quantity: number }) =>
        tx.medicine.update({
          where: { id: item.medicineId },
          data: { stock: { increment: item.quantity } },
        })
      )
    );

    return cancelled;
  });

  ApiResponse.success(res, "Order cancelled successfully", updated);
});

// ─── GET /api/seller/orders ───────────────────────────────────
export const getSellerOrders = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { page, limit } = req.query as PaginationQuery;
  const { skip, take, page: pg, limit: lm } = getPaginationParams(page, limit);

  const where = { items: { some: { medicine: { sellerId: req.user!.id } } } };

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        items: {
          where: { medicine: { sellerId: req.user!.id } },
          include: { medicine: { select: { id: true, name: true, imageUrl: true } } },
        },
      },
    }),
    prisma.order.count({ where }),
  ]);

  ApiResponse.success(res, "Seller orders fetched successfully", {
    orders,
    pagination: buildPaginationMeta(total, pg, lm),
  });
});

// ─── PATCH /api/seller/orders/:id ────────────────────────────
export const updateOrderStatus = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const id = req.params["id"] as string;
  const { status } = req.body as { status: OrderStatus };

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: {
        include: { medicine: { select: { sellerId: true } } },
      },
    },
  });

  if (!order) throw ApiError.notFound("Order not found");

  const sellerOwnsItem = order.items.some(
    (item: { medicine: { sellerId: string } }) => item.medicine.sellerId === req.user!.id
  );
  if (!sellerOwnsItem) throw ApiError.forbidden("This order does not belong to you");

  if (order.status === "CANCELLED" || order.status === "DELIVERED") {
    throw ApiError.badRequest(`Cannot update a "${order.status}" order`);
  }

  const updated = await prisma.order.update({
    where: { id },
    data: { status },
  });

  ApiResponse.success(res, "Order status updated successfully", updated);
});

// ─── GET /api/admin/orders ────────────────────────────────────
export const getAllOrders = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { page, limit } = req.query as PaginationQuery;
  const { skip, take, page: pg, limit: lm } = getPaginationParams(page, limit);

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      skip,
      take,
      orderBy: { createdAt: "desc" },
      include: {
        customer: { select: { id: true, name: true, email: true } },
        items: {
          include: { medicine: { select: { id: true, name: true } } },
        },
      },
    }),
    prisma.order.count(),
  ]);

  ApiResponse.success(res, "All orders fetched successfully", {
    orders,
    pagination: buildPaginationMeta(total, pg, lm),
  });
});
