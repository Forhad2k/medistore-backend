// ============================================================
// MediStore – Express App Configuration
// ============================================================

import express, { Application, Request, Response, NextFunction } from "express";
import cors from "cors";
import morgan from "morgan";
import "dotenv/config";

// ─── Routes ──────────────────────────────────────────────────
import authRoutes from "./routes/auth.routes";
import medicineRoutes from "./routes/medicine.routes";
import categoryRoutes from "./routes/category.routes";
import orderRoutes from "./routes/order.routes";
import sellerRoutes from "./routes/seller.routes";
import adminRoutes from "./routes/admin.routes";
import reviewRoutes from "./routes/review.routes";

// ─── Middlewares ──────────────────────────────────────────────
import errorHandler from "./middlewares/errorHandler";
import ApiError from "./utils/ApiError";

const app: Application = express();

// ─── Global Middleware ────────────────────────────────────────
app.use(
  cors({
    origin: process.env.CLIENT_URL ?? "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

// ─── Health Check ─────────────────────────────────────────────
app.get("/health", (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: "MediStore API is running 💊",
    timestamp: new Date().toISOString(),
  });
});

// ─── API Routes ───────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/medicines", medicineRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/seller", sellerRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/reviews", reviewRoutes);

// ─── 404 Handler ──────────────────────────────────────────────
app.use((req: Request, _res: Response, next: NextFunction) => {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
});

// ─── Global Error Handler ─────────────────────────────────────
app.use(errorHandler);

export default app;
