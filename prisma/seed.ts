// ============================================================
// MediStore – Database Seeder (Prisma v7)
// ============================================================

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main(): Promise<void> {
  console.log("🌱 Starting seed...\n");

  // ─── Admin ────────────────────────────────────────────────
  const adminPassword = await bcrypt.hash("admin123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@medistore.com" },
    update: {},
    create: {
      name: "Super Admin",
      email: "admin@medistore.com",
      password: adminPassword,
      role: "ADMIN",
      phone: "01700000000",
    },
  });
  console.log(`✅ Admin:    ${admin.email}`);

  // ─── Demo Seller ──────────────────────────────────────────
  const sellerPassword = await bcrypt.hash("seller123", 12);
  const seller = await prisma.user.upsert({
    where: { email: "seller@medistore.com" },
    update: {},
    create: {
      name: "Demo Pharmacy",
      email: "seller@medistore.com",
      password: sellerPassword,
      role: "SELLER",
      phone: "01711111111",
    },
  });
  console.log(`✅ Seller:   ${seller.email}`);

  // ─── Demo Customer ────────────────────────────────────────
  const customerPassword = await bcrypt.hash("customer123", 12);
  const customer = await prisma.user.upsert({
    where: { email: "customer@medistore.com" },
    update: {},
    create: {
      name: "John Doe",
      email: "customer@medistore.com",
      password: customerPassword,
      role: "CUSTOMER",
      phone: "01722222222",
    },
  });
  console.log(`✅ Customer: ${customer.email}`);

  // ─── Categories ───────────────────────────────────────────
  const categories = [
    { name: "Pain Relief",          description: "Analgesics and pain management" },
    { name: "Vitamins & Supplements", description: "Nutritional supplements" },
    { name: "Cold & Flu",           description: "Cold, cough and flu medicines" },
    { name: "Digestive Health",     description: "Antacids and digestive aids" },
    { name: "Skin Care",            description: "Topical medicines and skin treatments" },
    { name: "Eye & Ear Care",       description: "Eye drops and ear care products" },
    { name: "Allergy Relief",       description: "Antihistamines and allergy relief" },
    { name: "First Aid",            description: "Wound care and first aid essentials" },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    });
  }
  console.log(`✅ ${categories.length} categories seeded`);

  console.log("\n🎉 Seed complete!");
  console.log("──────────────────────────────────────────────────");
  console.log("  Admin:    admin@medistore.com    / admin123");
  console.log("  Seller:   seller@medistore.com   / seller123");
  console.log("  Customer: customer@medistore.com / customer123");
  console.log("──────────────────────────────────────────────────");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });