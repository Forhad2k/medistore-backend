// ============================================================
// Global Error Handler – last middleware in the chain
// ============================================================

import { Request, Response, NextFunction } from "express";
import ApiError from "../utils/ApiError";

interface PrismaError extends Error {
  code?: string;
  meta?: { target?: string[] };
}

const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // ─── Operational API Error ──────────────────────────────
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.errors.length > 0 && { errors: err.errors }),
    });
    return;
  }

  // ─── Prisma Known Request Errors ────────────────────────
  const prismaErr = err as PrismaError;

  if (prismaErr.code === "P2002") {
    res.status(409).json({
      success: false,
      message: "A record with this value already exists",
      field: prismaErr.meta?.target,
    });
    return;
  }

  if (prismaErr.code === "P2025") {
    res.status(404).json({
      success: false,
      message: "Record not found",
    });
    return;
  }

  // ─── Unknown Errors ───────────────────────────────────
  console.error("💥 Unhandled Error:", err);

  res.status(500).json({
    success: false,
    message:
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : err.message,
  });
};

export default errorHandler;
