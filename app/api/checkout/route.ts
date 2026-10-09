import { NextRequest, NextResponse } from "next/server";
import { checkoutSchema } from "@/lib/validation/checkout";
import { createOrder } from "@/lib/orders/create-order";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = checkoutSchema.safeParse(body);
    if (!parsed.success) {
      const msg = parsed.error.errors[0]?.message || "Invalid checkout data";
      return NextResponse.json({ success: false, error: msg }, { status: 400 });
    }

    const result = await createOrder(parsed.data);
    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }
    return NextResponse.json(result);
  } catch (err) {
    console.error("[POST /api/checkout]", err);
    return NextResponse.json(
      { success: false, error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
