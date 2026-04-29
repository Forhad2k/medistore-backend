// ============================================================
// MediStore – Shared TypeScript Types & Interfaces
// ============================================================

import { Request } from "express";

export type UserRole = "CUSTOMER" | "SELLER" | "ADMIN";
export type OrderStatus = "PLACED" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED";

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isBanned: boolean;
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
}

export interface JwtPayload {
  id: string;
  role: UserRole;
}

export interface PaginationQuery {
  page?: string;
  limit?: string;
}

export interface MedicineFilterQuery extends PaginationQuery {
  search?: string;
  categoryId?: string;
  minPrice?: string;
  maxPrice?: string;
  manufacturer?: string;
}
