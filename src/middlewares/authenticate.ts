// ============================================================
// authenticate – Verifies Bearer JWT and attaches req.user
// ============================================================

import { Response, NextFunction } from "express";
import { verifyToken } from "../utils/tokenUtils";
import ApiError from "../utils/ApiError";
import asyncHandler from "../utils/asyncHandler";
import prisma from "../config/db";
import { AuthRequest } from "../types/index";

const authenticate = asyncHandler(
  async (req: AuthRequest, _res: Response, next: NextFunction): Promise<void> => {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      throw ApiError.unauthorized("Access token is missing or malformed");
    }

    const token = authHeader.split(" ")[1];

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch {
      throw ApiError.unauthorized("Invalid or expired access token");
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, name: true, email: true, role: true, isBanned: true },
    });

    if (!user) {
      throw ApiError.unauthorized("User account no longer exists");
    }

    if (user.isBanned) {
      throw ApiError.forbidden("Your account has been suspended. Contact support.");
    }

    req.user = user;
    next();
  }
);

export default authenticate;
