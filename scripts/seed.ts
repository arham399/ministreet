import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { getDrizzleClient } from "@/lib/db/drizzle/client";
import {
  category,
  faq,
  product,
  productImage,
  productTag,
  siteSetting,
  user,
} from "@/lib/db/drizzle/schema";

const categories = [
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
  const { db, pool } = getDrizzleClient();
  try {
    console.info("Seeding Mini Street...");

    for (const item of categories) {
      await db
        .insert(category)
        .values({ ...item, updatedAt: new Date() })
        .onConflictDoUpdate({
          target: category.slug,
          set: {
            name: item.name,
            description: item.description,
            displayOrder: item.displayOrder,
            updatedAt: new Date(),
          },
        });
    }

    const [earrings] = await db.select().from(category).where(eq(category.slug, "earrings"));
    const [bracelets] = await db.select().from(category).where(eq(category.slug, "bracelets"));

    const sampleProducts = [
      earrings && {
        sku: "MS-EAR-001",
        name: "Pearl Drop Earrings",
        slug: "pearl-drop-earrings",
        description: "Elegant pearl drop earrings with a soft golden finish. Perfect for everyday sparkle.",
        price: "1599",
        salePrice: "1299",
        stockQuantity: 25,
        lowStockThreshold: 5,
        isActive: true,
        isNewArrival: true,
        isFeatured: false,
        categoryId: earrings.id,
        tags: ["pearl", "gold", "everyday"],
        image: { url: "/images/products/pearl-drop-earrings.svg", alt: "Pearl Drop Earrings" },
      },
      bracelets && {
        sku: "MS-BRA-001",
        name: "Golden Heart Bracelet",
        slug: "golden-heart-bracelet",
        description: "A delicate golden heart bracelet that adds charm to any wrist.",
        price: "1899",
        salePrice: "1499",
        stockQuantity: 18,
        lowStockThreshold: 5,
        isActive: true,
        isNewArrival: true,
        isFeatured: true,
        categoryId: bracelets.id,
        tags: ["heart", "gold", "gift"],
        image: { url: "/images/products/golden-heart-bracelet.svg", alt: "Golden Heart Bracelet" },
      },
    ].filter((item): item is NonNullable<typeof item> => item != null);

    for (const item of sampleProducts) {
      await db
        .insert(product)
        .values({
          name: item.name,
          slug: item.slug,
          sku: item.sku,
          description: item.description,
          price: item.price,
          salePrice: item.salePrice,
          stockQuantity: item.stockQuantity,
          lowStockThreshold: item.lowStockThreshold,
          isActive: item.isActive,
          isNewArrival: item.isNewArrival,
          isFeatured: item.isFeatured,
          categoryId: item.categoryId,
          updatedAt: new Date(),
        })
        .onConflictDoNothing({ target: product.sku });

      const [stored] = await db.select().from(product).where(eq(product.sku, item.sku));
      if (!stored) throw new Error(`Seed product ${item.sku} could not be read after upsert.`);
      for (const name of item.tags) {
        await db.insert(productTag).values({ productId: stored.id, name }).onConflictDoNothing();
      }
      const [image] = await db
        .select({ id: productImage.id })
        .from(productImage)
        .where(eq(productImage.productId, stored.id))
        .limit(1);
      if (!image) {
        await db.insert(productImage).values({
          id: crypto.randomUUID(),
          productId: stored.id,
          ...item.image,
          isPrimary: true,
          sortOrder: 0,
        });
      }
    }

    const settings = [
      { key: "announcement_text", value: "Adorably enchanting treasures, made to sparkle with you." },
      { key: "announcement_visible", value: "true" },
      { key: "store_email", value: "STORE_EMAIL" },
      { key: "store_phone", value: "STORE_PHONE" },
      { key: "free_shipping_threshold", value: "5000" },
      { key: "default_shipping_cost", value: "250" },
    ];
    for (const setting of settings) {
      await db
        .insert(siteSetting)
        .values({ ...setting, updatedAt: new Date() })
        .onConflictDoUpdate({
          target: siteSetting.key,
          set: { value: setting.value, updatedAt: new Date() },
        });
    }

    const faqs = [
      { category: "Orders", question: "How do I place an order?", answer: "Browse our collection, add items to your cart, and proceed to checkout. Cash on Delivery is available.", displayOrder: 1 },
      { category: "Orders", question: "Can I modify my order?", answer: "Please contact us as soon as possible. Once your order is packed, changes may not be possible.", displayOrder: 2 },
      { category: "Shipping", question: "How long does delivery take?", answer: "Delivery times vary by city. Track your order using the tracking ID provided after checkout.", displayOrder: 1 },
      { category: "Shipping", question: "How can I track my order?", answer: "Use the Track Order page and enter the order or tracking ID.", displayOrder: 2 },
      { category: "Returns", question: "What is the return policy?", answer: "Please see the Returns Policy page for current terms and contact us if you need help.", displayOrder: 1 },
    ];
    for (const item of faqs) {
      const [existing] = await db
        .select({ id: faq.id })
        .from(faq)
        .where(eq(faq.question, item.question))
        .limit(1);
      if (!existing) {
        await db.insert(faq).values({ ...item, updatedAt: new Date() });
      }
    }

    const ownerEmail = process.env.OWNER_EMAIL?.trim().toLowerCase();
    const ownerPassword = process.env.OWNER_PASSWORD;
    if (ownerEmail && ownerPassword) {
      const [existing] = await db.select({ id: user.id }).from(user).where(eq(user.email, ownerEmail));
      if (!existing) {
        await db.insert(user).values({
          id: crypto.randomUUID(),
          email: ownerEmail,
          name: process.env.OWNER_NAME || "Mini Street Owner",
          passwordHash: await bcrypt.hash(ownerPassword, 12),
          role: "OWNER",
          updatedAt: new Date(),
        });
      }
    } else {
      console.info("Skipping owner account; set OWNER_EMAIL and OWNER_PASSWORD to create one.");
    }

    console.info("Seed complete.");
  } finally {
    await pool.end();
  }
}

main().catch((error: unknown) => {
  console.error("[db:seed]", error);
  process.exitCode = 1;
});
