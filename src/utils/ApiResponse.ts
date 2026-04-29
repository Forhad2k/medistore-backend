// ============================================================
// ApiResponse – Standardised JSON response helper
// ============================================================

import { Response } from "express";

interface ResponseBody<T> {
  success: boolean;
  message: string;
  data?: T;
}

class ApiResponse {
  static success<T>(
    res: Response,
    message: string,
    data?: T,
    statusCode = 200
  ): Response {
    const body: ResponseBody<T> = { success: true, message };
    if (data !== undefined) body.data = data;
    return res.status(statusCode).json(body);
  }

  static created<T>(res: Response, message: string, data?: T): Response {
    return ApiResponse.success(res, message, data, 201);
  }

  static noContent(res: Response): Response {
    return res.status(204).send();
  }
}

export default ApiResponse;
