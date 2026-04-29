// ============================================================
// validate – Runs express-validator checks & short-circuits
// ============================================================

import { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";
import ApiError from "../utils/ApiError";

const validate = (req: Request, _res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw ApiError.badRequest("Validation failed", errors.array());
  }
  next();
};

export default validate;
