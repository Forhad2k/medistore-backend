// ============================================================
// MediStore – Server Entry Point
// ============================================================

import "dotenv/config";
import app from "./app";
import prisma from "./config/db";

const PORT = parseInt(process.env.PORT ?? "5000", 10);

async function startServer(): Promise<void> {
  try {
    // Verify database connection before starting
    await prisma.$connect();
    console.log("✅ Database connected successfully");

    app.listen(PORT, () => {
      console.log("\n╔══════════════════════════════════════╗");
      console.log("║       MediStore API – Running 💊      ║");
      console.log("╠══════════════════════════════════════╣");
      console.log(`║  Port    : ${PORT}                        ║`);
      console.log(`║  Mode    : ${process.env.NODE_ENV ?? "development"}              ║`);
      console.log(`║  Health  : http://localhost:${PORT}/health  ║`);
      console.log("╚══════════════════════════════════════╝\n");
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

// ─── Graceful Shutdown ────────────────────────────────────────
const gracefulShutdown = async (signal: string): Promise<void> => {
  console.log(`\n⚠️  ${signal} received. Shutting down gracefully...`);
  await prisma.$disconnect();
  console.log("🔌 Database disconnected. Goodbye!");
  process.exit(0);
};

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

// ─── Unhandled Rejections & Exceptions ───────────────────────
process.on("unhandledRejection", (reason: unknown) => {
  console.error("💥 Unhandled Rejection:", reason);
  process.exit(1);
});

process.on("uncaughtException", (error: Error) => {
  console.error("💥 Uncaught Exception:", error.message);
  process.exit(1);
});

startServer();
