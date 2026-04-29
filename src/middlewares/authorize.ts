// ============================================================
// authorize – Role-Based Access Control (RBAC) middleware
// Usage: authorize("ADMIN") | authorize("ADMIN", "SELLER")
// ============================================================

import { Response, NextFunction } from "express";
import ApiError from "../utils/ApiError";
import { AuthRequest, UserRole } from "../types/index";

const authorize = (...allowedRoles: UserRole[]) => {
  return (req: AuthRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw ApiError.unauthorized("Not authenticated");
    }
    if (!allowedRoles.includes(req.user.role)) {
      throw ApiError.forbidden(
        `Access denied. Required role(s): ${allowedRoles.join(", ")}`
      );
    }
    next();
  };
};

export default authorize;
