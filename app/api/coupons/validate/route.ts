import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function POST(req: NextRequest) {
  try {
    const { code, subtotal } = await req.json();
    if (!code) return NextResponse.json({ valid: false, error: "Code required" }, { status: 400 });

    const coupon = await prisma.coupon.findUnique({
      where: { code: String(code).toUpperCase() },
    });
    if (!coupon || !coupon.isActive) {
      return NextResponse.json({ valid: false, error: "Invalid coupon" });
    }
    const now = new Date();
    if (coupon.startsAt && coupon.startsAt > now) {
      return NextResponse.json({ valid: false, error: "Coupon not yet active" });
    }
    if (coupon.endsAt && coupon.endsAt < now) {
      return NextResponse.json({ valid: false, error: "Coupon expired" });
    }
    if (coupon.usageLimit != null && coupon.usageCount >= coupon.usageLimit) {
      return NextResponse.json({ valid: false, error: "Coupon usage limit reached" });
    }
    if (coupon.minOrderAmount && Number(subtotal) < Number(coupon.minOrderAmount)) {
      return NextResponse.json({
        valid: false,
        error: `Minimum order Rs. ${coupon.minOrderAmount}`,
      });
    }

    let discountAmount = 0;
    if (coupon.type === "PERCENTAGE") {
      discountAmount = (Number(subtotal) * Number(coupon.value)) / 100;
      if (coupon.maxDiscount) {
        discountAmount = Math.min(discountAmount, Number(coupon.maxDiscount));
      }
    } else {
      discountAmount = Number(coupon.value);
    }

    return NextResponse.json({
      valid: true,
      code: coupon.code,
      type: coupon.type,
      value: Number(coupon.value),
      discountAmount: Math.round(discountAmount * 100) / 100,
    });
  } catch {
    return NextResponse.json({ valid: false, error: "Validation failed" }, { status: 500 });
  }
}
