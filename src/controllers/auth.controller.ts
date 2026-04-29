// ============================================================
// Auth Controller – register | login | getMe | profile
// ============================================================

import { Response } from "express";
import bcrypt from "bcryptjs";
import prisma from "../config/db";
import { generateToken } from "../utils/tokenUtils";
import ApiError from "../utils/ApiError";
import ApiResponse from "../utils/ApiResponse";
import asyncHandler from "../utils/asyncHandler";
import { AuthRequest, UserRole } from "../types/index";

// ─── POST /api/auth/register ──────────────────────────────────
export const register = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { name, email, password, role, phone, address } = req.body as {
    name: string;
    email: string;
    password: string;
    role?: UserRole;
    phone?: string;
    address?: string;
  };

  if (role === "ADMIN") {
    throw ApiError.forbidden("Cannot self-register as ADMIN");
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw ApiError.conflict("An account with this email already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: role ?? "CUSTOMER",
      phone,
      address,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      phone: true,
      address: true,
      createdAt: true,
    },
  });

  const token = generateToken({ id: user.id, role: user.role as UserRole });

  ApiResponse.created(res, "Registration successful", { user, token });
});

// ─── POST /api/auth/login ─────────────────────────────────────
export const login = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { email, password } = req.body as { email: string; password: string };

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    throw ApiError.unauthorized("Invalid email or password");
  }

  if (user.isBanned) {
    throw ApiError.forbidden("Your account has been suspended. Contact support.");
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw ApiError.unauthorized("Invalid email or password");
  }

  const token = generateToken({ id: user.id, role: user.role as UserRole });

  const { password: _pw, ...safeUser } = user;
  void _pw;

  ApiResponse.success(res, "Login successful", { user: safeUser, token });
});

// ─── GET /api/auth/me ─────────────────────────────────────────
export const getMe = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
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
    },
  });

  ApiResponse.success(res, "User fetched successfully", user);
});

// ─── PATCH /api/auth/profile ──────────────────────────────────
export const updateProfile = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { name, phone, address } = req.body as {
    name?: string;
    phone?: string;
    address?: string;
  };

  const user = await prisma.user.update({
    where: { id: req.user!.id },
    data: { name, phone, address },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      phone: true,
      address: true,
      updatedAt: true,
    },
  });

  ApiResponse.success(res, "Profile updated successfully", user);
});

// ─── PATCH /api/auth/change-password ─────────────────────────
export const changePassword = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { currentPassword, newPassword } = req.body as {
    currentPassword: string;
    newPassword: string;
  };

  const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
  if (!user) throw ApiError.notFound("User not found");

  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) throw ApiError.badRequest("Current password is incorrect");

  const hashed = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({ where: { id: user.id }, data: { password: hashed } });

  ApiResponse.success(res, "Password changed successfully");
});
