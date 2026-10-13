import { NextRequest, NextResponse } from "next/server";
import { checkoutSchema } from "@/lib/validation/checkout";
import { createOrder } from "@/lib/orders/create-order";
import { deletePaymentProof, uploadPaymentProof } from "@/lib/storage/payment-proofs";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  let uploadedPath: string | null = null;
  try {
    const form = await req.formData();
    const rawCheckoutData = form.get("checkoutData");
    if (typeof rawCheckoutData !== "string") {
      return NextResponse.json({ success: false, error: "Invalid checkout data." }, { status: 400 });
    }
    let body: unknown;
    try { body = JSON.parse(rawCheckoutData); } catch {
      return NextResponse.json({ success: false, error: "Invalid checkout data." }, { status: 400 });
    }
    const parsed = checkoutSchema.safeParse(body);
    if (!parsed.success) {
      const msg = parsed.error.errors[0]?.message || "Invalid checkout data";
      return NextResponse.json({ success: false, error: msg }, { status: 400 });
    }

    const proof = form.get("paymentProof");
    if (!(proof instanceof File)) {
      return NextResponse.json({ success: false, error: "Upload your payment screenshot to continue." }, { status: 400 });
    }
    const proofPath = await uploadPaymentProof(proof);
    uploadedPath = proofPath;
    const result = await createOrder(parsed.data, proofPath);
    if (!result.success) {
      await deletePaymentProof(proofPath);
      uploadedPath = null;
      return NextResponse.json(result, { status: 400 });
    }
    uploadedPath = null;
    return NextResponse.json(result);
  } catch (err) {
    if (uploadedPath) await deletePaymentProof(uploadedPath);
    console.error("[POST /api/checkout]", err);
    const message = err instanceof Error ? err.message : "Something went wrong. Please try again.";
    return NextResponse.json(
      { success: false, error: message },
      { status: message.startsWith("Upload ") || message.startsWith("The uploaded") || message.startsWith("The screenshot") ? 400 : 500 }
    );
  }
}
