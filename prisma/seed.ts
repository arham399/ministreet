/**
 * Development seed data for Mini Street.
 * NEVER ship this as production customer data.
 * Run: npm run db:seed
 */
import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const CATEGORIES = [
  { name: "Earrings", slug: "earrings", description: "Delicate earrings for every little moment.", displayOrder: 1 },
  { name: "Bracelets", slug: "bracelets", description: "Beautiful bracelets to stack and style.", displayOrder: 2 },
  { name: "Necklaces", slug: "necklaces", description: "Necklaces that add a soft sparkle.", displayOrder: 3 },
  { name: "Rings", slug: "rings", description: "Rings for every finger and mood.", displayOrder: 4 },
  { name: "Watches", slug: "watches", description: "Elegant watches with a feminine touch.", displayOrder: 5 },
  { name: "Handchains", slug: "handchains", description: "Handchains that connect beauty and detail.", displayOrder: 6 },
  { name: "Handcuffs", slug: "handcuffs", description: "Statement handcuffs with delicate charm.", displayOrder: 7 },
  { name: "Combo Sets", slug: "combo-sets", description: "Curated sets ready to gift or keep.", displayOrder: 8 },
];

async function main() {
  console.log("🌱 Seeding Mini Street...");

  // Categories
  for (const cat of CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: cat,
      create: cat,
    });
  }
  console.log("✓ Categories");

  // Sample products (placeholders — replace with real product data)
  const earrings = await prisma.category.findUnique({ where: { slug: "earrings" } });
  const bracelets = await prisma.category.findUnique({ where: { slug: "bracelets" } });

  if (earrings) {
    await prisma.product.upsert({
      where: { sku: "MS-EAR-001" },
      update: {},
      create: {
        name: "Pearl Drop Earrings",
        slug: "pearl-drop-earrings",
        sku: "MS-EAR-001",
        description: "Elegant pearl drop earrings with a soft golden finish. Perfect for everyday sparkle.",
        price: 1599,
        salePrice: 1299,
        stockQuantity: 25,
        lowStockThreshold: 5,
        isActive: true,
        isNewArrival: true,
        categoryId: earrings.id,
        tags: {
          create: ["pearl", "gold", "everyday"].map((name) => ({ name })),
        },
        images: {
          create: [{ url: "/images/placeholders/product.svg", alt: "Pearl Drop Earrings", isPrimary: true, sortOrder: 0 }],
        },
      },
    });
  }

  if (bracelets) {
    await prisma.product.upsert({
      where: { sku: "MS-BRA-001" },
      update: {},
      create: {
        name: "Golden Heart Bracelet",
        slug: "golden-heart-bracelet",
        sku: "MS-BRA-001",
        description: "A delicate golden heart bracelet that adds charm to any wrist.",
        price: 1899,
        salePrice: 1499,
        stockQuantity: 18,
        isActive: true,
        isNewArrival: true,
        isFeatured: true,
        categoryId: bracelets.id,
        tags: {
          create: ["heart", "gold", "gift"].map((name) => ({ name })),
        },
        images: {
          create: [{ url: "/images/placeholders/product.svg", alt: "Golden Heart Bracelet", isPrimary: true, sortOrder: 0 }],
        },
      },
    });
  }
  console.log("✓ Sample products");

  // Site settings
  const settings = [
    { key: "announcement_text", value: "✨ Adorably enchanting treasures, made to sparkle with you." },
    { key: "announcement_visible", value: "true" },
    { key: "store_email", value: "STORE_EMAIL" },
    { key: "store_phone", value: "STORE_PHONE" },
    { key: "free_shipping_threshold", value: "3000" },
    { key: "default_shipping_cost", value: "200" },
  ];
  for (const s of settings) {
    await prisma.siteSetting.upsert({
      where: { key: s.key },
      update: { value: s.value },
      create: s,
    });
  }
  console.log("✓ Site settings");

  // FAQs
  const faqs = [
    { category: "Orders", question: "How do I place an order?", answer: "Browse our collection, add items to your cart, and proceed to checkout. Cash on Delivery is available.", displayOrder: 1 },
    { category: "Orders", question: "Can I modify my order?", answer: "Please contact us as soon as possible. Once an order is packed, changes may not be possible.", displayOrder: 2 },
    { category: "Shipping", question: "How long does delivery take?", answer: "Delivery times vary by city. You can track your order using the tracking ID provided after checkout.", displayOrder: 1 },
    { category: "Shipping", question: "How can I track my order?", answer: "Use the Track Order page and enter your order or tracking ID (e.g. MS-2026-000184).", displayOrder: 2 },
    { category: "Returns", question: "What is the return policy?", answer: "Please see our Returns Policy page for current terms. Contact us if you have any issues with your order.", displayOrder: 1 },
  ];
  for (const f of faqs) {
    await prisma.faq.create({ data: f });
  }
  console.log("✓ FAQs");

  // Owner account from env (optional)
  const ownerEmail = process.env.OWNER_EMAIL;
  const ownerPassword = process.env.OWNER_PASSWORD;
  if (ownerEmail && ownerPassword) {
    const hash = await bcrypt.hash(ownerPassword, 12);
    await prisma.user.upsert({
      where: { email: ownerEmail },
      update: {},
      create: {
        email: ownerEmail,
        name: process.env.OWNER_NAME || "Mini Street Owner",
        passwordHash: hash,
        role: Role.OWNER,
      },
    });
    console.log("✓ Owner account");
  } else {
    console.log("ℹ Skip owner — set OWNER_EMAIL and OWNER_PASSWORD to create one");
  }

  console.log("🌱 Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
