import { NextRequest, NextResponse } from "next/server";
import { auth, isAdminRole } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import { offerSchema } from "@/lib/validation/coupon";

export async function GET() {
  const offers = await prisma.offer.findMany({
    where: { isActive: true },
    orderBy: { displayOrder: "asc" },
  });
  return NextResponse.json({ offers });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const parsed = offerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message }, { status: 400 });
  }
  const d = parsed.data;
  const offer = await prisma.offer.create({
    data: {
      title: d.title,
      description: d.description,
      imageUrl: d.imageUrl,
      linkUrl: d.linkUrl,
      startsAt: d.startsAt ? new Date(d.startsAt) : null,
      endsAt: d.endsAt ? new Date(d.endsAt) : null,
      isActive: d.isActive,
      displayOrder: d.displayOrder,
    },
  });
  return NextResponse.json({ success: true, offer }, { status: 201 });
}
