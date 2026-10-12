import { prisma } from "@/lib/db/prisma";

export async function getActiveAutomaticDiscounts() {
  const now = new Date();
  return prisma.discount.findMany({
    where: {
      isActive: true,
      AND: [
        { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
        { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
      ],
    },
    include: {
      products: { select: { productId: true } },
      categories: { select: { id: true } },
    },
  });
}
