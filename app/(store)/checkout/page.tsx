"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, ClipboardCheck, Copy, MapPin, UserRound } from "lucide-react";
import { useCartStore } from "@/lib/cart/store";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PAYMENT_ACCOUNT } from "@/lib/constants";
import { useShippingSettings } from "@/components/providers/shipping-settings-provider";
import { CartHydration } from "@/components/providers/cart-provider";
import { PakistanLocationFields } from "@/components/checkout/pakistan-location-fields";
import { useCartDiscountQuote } from "@/hooks/use-cart-discount-quote";

const CHECKOUT_STEPS = [
  { title: "Your details", description: "Contact information", icon: UserRound },
  { title: "Delivery", description: "Shipping address", icon: MapPin },
  { title: "Review & place order", description: "Confirm your order", icon: ClipboardCheck },
] as const;

function CheckoutForm() {
  const router = useRouter();
  const { items, getSubtotal, clearCart } = useCartStore();
  const { freeShippingThreshold, defaultShippingCost } = useShippingSettings();
  const { quote, error: quoteError, loading: quoteLoading } = useCartDiscountQuote();
  const formRef = useRef<HTMLFormElement>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [accountCopied, setAccountCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [couponMessage, setCouponMessage] = useState("");
  const [couponMessageType, setCouponMessageType] = useState<"success" | "error" | "">("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountAmount: number;
  } | null>(null);
  const [customerEmail, setCustomerEmail] = useState("");
  const [reviewDetails, setReviewDetails] = useState<{
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    shippingLine1: string;
    shippingLine2: string;
    shippingCity: string;
    shippingProvince: string;
    shippingPostalCode: string;
    deliveryNotes: string;
  } | null>(null);

  const subtotal = quote?.subtotal ?? getSubtotal();
  const discount = appliedCoupon?.discountAmount ?? 0;
  const discountedSubtotal = Math.max(0, subtotal - discount);
  const shipping = discountedSubtotal >= freeShippingThreshold ? 0 : defaultShippingCost;
  const total = discountedSubtotal + shipping;
  const cartFingerprint = JSON.stringify(items.map((item) => [item.productId, item.quantity]));
  const previousCartFingerprint = useRef(cartFingerprint);

  useEffect(() => {
    if (previousCartFingerprint.current === cartFingerprint) return;
    previousCartFingerprint.current = cartFingerprint;
    setAppliedCoupon(null);
    setCouponMessage(couponCode ? "Your cart changed. Reapply the coupon to refresh the discount." : "");
    setCouponMessageType(couponCode ? "error" : "");
  }, [cartFingerprint, couponCode]);

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="font-display text-3xl font-semibold mb-3">Checkout</h1>
        <p className="text-[var(--muted)] mb-6">Your cart is empty.</p>
        <Button asChild>
          <Link href="/shop">Shop Collection</Link>
        </Button>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (currentStep !== CHECKOUT_STEPS.length - 1) {
      setError(null);
      return;
    }
    setError(null);
    const form = e.currentTarget;
    const invalidField = form.querySelector<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
      ":invalid",
    );
    if (invalidField) {
      const invalidStep = invalidField.closest<HTMLElement>("[data-checkout-step]");
      const stepIndex = Number(invalidStep?.dataset.checkoutStep);
      if (Number.isInteger(stepIndex)) {
        setCurrentStep(stepIndex);
        window.requestAnimationFrame(() => {
          form
            .querySelector<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
              "[data-checkout-step]:not([hidden]) :invalid",
            )
            ?.focus();
        });
      } else {
        invalidField.focus();
      }
      invalidField.reportValidity();
      return;
    }
    if (couponCode.trim() && !appliedCoupon) {
      setError("Apply or remove your coupon code before placing the order.");
      return;
    }
    if (quoteLoading || quoteError || !quote) {
      setError(quoteError || "Please wait while we confirm the current discounts.");
      return;
    }
    setLoading(true);

    const formData = new FormData(form);
    const payload = {
      customerName: String(formData.get("customerName") || ""),
      customerEmail: String(formData.get("customerEmail") || ""),
      customerPhone: String(formData.get("customerPhone") || ""),
      shippingLine1: String(formData.get("shippingLine1") || ""),
      shippingLine2: String(formData.get("shippingLine2") || "") || null,
      shippingCity: String(formData.get("shippingCity") || ""),
      shippingProvince: String(formData.get("shippingProvince") || ""),
      shippingPostalCode: String(formData.get("shippingPostalCode") || "") || null,
      deliveryNotes: String(formData.get("deliveryNotes") || "") || null,
      paymentMethod: "BANK_TRANSFER" as const,
      couponCode: appliedCoupon?.code ?? null,
      items: items.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
      })),
    };

    try {
      const requestBody = new FormData();
      requestBody.set("checkoutData", JSON.stringify(payload));
      const paymentProof = formData.get("paymentProof");
      if (paymentProof instanceof File && paymentProof.size > 0) {
        requestBody.set("paymentProof", paymentProof);
      }
      const res = await fetch("/api/checkout", {
        method: "POST",
        body: requestBody,
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || "Checkout failed. Please try again.");
        setLoading(false);
        return;
      }
      clearCart();
      router.push(`/order-success/${data.orderId}`);
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  function continueToNextStep() {
    setError(null);
    const section = formRef.current?.querySelector<HTMLElement>(
      `[data-checkout-step="${currentStep}"]`,
    );
    const invalidField = section?.querySelector<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >(":invalid");
    if (invalidField) {
      invalidField.reportValidity();
      invalidField.focus();
      return;
    }
    if (currentStep === 1 && formRef.current) {
      const formData = new FormData(formRef.current);
      setReviewDetails({
        customerName: String(formData.get("customerName") || ""),
        customerEmail: String(formData.get("customerEmail") || ""),
        customerPhone: String(formData.get("customerPhone") || ""),
        shippingLine1: String(formData.get("shippingLine1") || ""),
        shippingLine2: String(formData.get("shippingLine2") || ""),
        shippingCity: String(formData.get("shippingCity") || ""),
        shippingProvince: String(formData.get("shippingProvince") || ""),
        shippingPostalCode: String(formData.get("shippingPostalCode") || ""),
        deliveryNotes: String(formData.get("deliveryNotes") || ""),
      });
    }
    setCurrentStep((step) => Math.min(step + 1, CHECKOUT_STEPS.length - 1));
  }

  async function handleApplyCoupon() {
    if (quoteLoading || quoteError || !quote) {
      setCouponMessage(quoteError || "Please wait while we confirm the current discounts.");
      setCouponMessageType("error");
      return;
    }
    const code = couponCode.trim();
    if (!code) {
      setAppliedCoupon(null);
      setCouponMessage("Enter a coupon code to apply.");
      setCouponMessageType("error");
      return;
    }

    setCouponLoading(true);
    setCouponMessage("");
    setCouponMessageType("");
    try {
      const response = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          customerEmail,
          items: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.valid) {
        setAppliedCoupon(null);
        setCouponMessage(result.error || "This coupon could not be applied.");
        setCouponMessageType("error");
        return;
      }

      setAppliedCoupon({
        code: result.code,
        discountAmount: Number(result.discountAmount),
      });
      setCouponCode(result.code);
      setCouponMessage(`${result.code} applied successfully.`);
      setCouponMessageType("success");
    } catch {
      setAppliedCoupon(null);
      setCouponMessage("Unable to validate the coupon right now. Please try again.");
      setCouponMessageType("error");
    } finally {
      setCouponLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="mb-8 rounded-[var(--radius-lg)] border border-[var(--border)] bg-white p-4 shadow-soft sm:p-6">
        <div className="relative">
          <div className="absolute left-[16.666%] right-[16.666%] top-5 h-px bg-[var(--border)]" aria-hidden="true" />
          <div
            className="absolute left-[16.666%] top-5 h-px bg-[var(--brand-pink)] transition-all duration-500"
            style={{ width: `${currentStep * 50}%`, maxWidth: "66.668%" }}
            aria-hidden="true"
          />
          <ol className="relative grid grid-cols-3 gap-1">
            {CHECKOUT_STEPS.map((step, index) => {
              const StepIcon = step.icon;
              const complete = index < currentStep;
              const active = index === currentStep;
              return (
                <li key={step.title} className="flex justify-center">
                  <div
                    className="flex min-w-0 flex-col items-center text-center"
                    aria-current={active ? "step" : undefined}
                  >
                    <span
                      className={`relative z-10 flex size-10 items-center justify-center rounded-full border-2 transition-colors ${
                        complete || active
                          ? "border-[var(--brand-pink)] bg-[var(--brand-pink)] text-white"
                          : "border-[var(--border)] bg-white text-[var(--muted)]"
                      } ${active ? "ring-4 ring-[var(--brand-blush)]" : ""}`}
                    >
                      {complete ? (
                        <Check size={17} strokeWidth={2.5} aria-hidden="true" />
                      ) : (
                        <StepIcon size={17} aria-hidden="true" />
                      )}
                    </span>
                    <span className={`mt-2 text-xs font-semibold sm:text-sm ${active ? "text-[var(--brand-pink)]" : "text-[var(--charcoal)]"}`}>
                      {step.title}
                    </span>
                    <span className="mt-0.5 hidden text-xs text-[var(--muted)] sm:block">
                      {step.description}
                    </span>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </div>

      <form ref={formRef} noValidate onSubmit={handleSubmit} className="grid items-start gap-8 lg:grid-cols-5">
        <div className={`space-y-6 lg:col-span-3 ${currentStep === 2 ? "order-2 lg:order-1" : "order-1"}`}>
          <section data-checkout-step="0" hidden={currentStep !== 0}>
            <div className="mb-5">
              <p className="section-label">Step 1 of 3</p>
              <h2 className="mt-1 font-display text-2xl font-semibold">Your details</h2>
              <p className="mt-1 text-sm text-[var(--muted)]">Where can we send your order updates?</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium mb-1.5" htmlFor="customerName">
                  Full name <span aria-hidden="true" className="text-[var(--error)]">*</span>
                </label>
                <Input id="customerName" name="customerName" required autoComplete="name" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" htmlFor="customerEmail">
                  Email <span aria-hidden="true" className="text-[var(--error)]">*</span>
                </label>
                <Input
                  id="customerEmail"
                  name="customerEmail"
                  type="email"
                  required
                  autoComplete="email"
                  value={customerEmail}
                  onChange={(event) => {
                    setCustomerEmail(event.target.value);
                    if (appliedCoupon) {
                      setAppliedCoupon(null);
                      setCouponMessage("Apply your coupon again after changing your email.");
                      setCouponMessageType("error");
                    }
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" htmlFor="customerPhone">
                  Phone <span aria-hidden="true" className="text-[var(--error)]">*</span>
                </label>
                <Input id="customerPhone" name="customerPhone" type="tel" required autoComplete="tel" />
              </div>
            </div>
          </section>

          <section data-checkout-step="1" hidden={currentStep !== 1}>
            <div className="mb-5">
              <p className="section-label">Step 2 of 3</p>
              <h2 className="mt-1 font-display text-2xl font-semibold">Delivery address</h2>
              <p className="mt-1 text-sm text-[var(--muted)]">Add the address where you’d like your order delivered.</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium mb-1.5" htmlFor="shippingLine1">
                  Address <span aria-hidden="true" className="text-[var(--error)]">*</span>
                </label>
                <Input id="shippingLine1" name="shippingLine1" required autoComplete="street-address" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium mb-1.5" htmlFor="shippingLine2">
                  Apartment, suite, etc. (optional)
                </label>
                <Input id="shippingLine2" name="shippingLine2" />
              </div>
              <PakistanLocationFields />
              <div>
                <label className="block text-sm font-medium mb-1.5" htmlFor="shippingPostalCode">
                  Postal code (optional)
                </label>
                <Input id="shippingPostalCode" name="shippingPostalCode" autoComplete="postal-code" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium mb-1.5" htmlFor="deliveryNotes">
                  Delivery notes (optional)
                </label>
                <Input id="deliveryNotes" name="deliveryNotes" />
              </div>
            </div>
          </section>

          <section data-checkout-step="2" hidden={currentStep !== 2}>
            <div className="mb-5">
              <p className="section-label">Step 3 of 3</p>
              <h2 className="mt-1 font-display text-2xl font-semibold">Review & place order</h2>
              <p className="mt-1 text-sm text-[var(--muted)]">Transfer the order total, then submit your payment confirmation for review.</p>
            </div>
            {reviewDetails && (
              <div className="mb-5 space-y-4 rounded-[var(--radius-md)] border border-[var(--border)] bg-white p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold">Contact</h3>
                    <p className="mt-1 text-sm text-[var(--muted)]">{reviewDetails.customerName}</p>
                    <p className="text-sm text-[var(--muted)]">{reviewDetails.customerEmail}</p>
                    <p className="text-sm text-[var(--muted)]">{reviewDetails.customerPhone}</p>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={() => setCurrentStep(0)}>
                    Edit
                  </Button>
                </div>
                <div className="flex items-start justify-between gap-4 border-t border-[var(--border)] pt-4">
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold">Delivery address</h3>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      {[
                        reviewDetails.shippingLine1,
                        reviewDetails.shippingLine2,
                        reviewDetails.shippingCity,
                        reviewDetails.shippingProvince,
                        reviewDetails.shippingPostalCode,
                      ].filter(Boolean).join(", ")}
                    </p>
                    {reviewDetails.deliveryNotes && (
                      <p className="mt-1 text-xs text-[var(--muted)]">Note: {reviewDetails.deliveryNotes}</p>
                    )}
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={() => setCurrentStep(1)}>
                    Edit
                  </Button>
                </div>
              </div>
            )}
            <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--brand-cream)] p-4 sm:p-5">
              <p className="section-label">Advance payment</p>
              <h3 className="mt-1 text-base font-semibold">Transfer to our HBL account</h3>
              <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                Pay the exact order total using your bank app or a supported wallet. We will confirm your order after verifying the payment.
              </p>
              <dl className="mt-4 divide-y divide-[var(--border)] rounded-[var(--radius-sm)] border border-[var(--border)] bg-white px-3 sm:px-4">
                <div className="flex items-center justify-between gap-4 py-3 text-sm">
                  <dt className="text-[var(--muted)]">Bank</dt><dd className="font-medium">{PAYMENT_ACCOUNT.bankName}</dd>
                </div>
                <div className="flex items-center justify-between gap-4 py-3 text-sm">
                  <dt className="text-[var(--muted)]">Account title</dt><dd className="text-right font-medium">{PAYMENT_ACCOUNT.accountTitle}</dd>
                </div>
                <div className="flex items-center justify-between gap-4 py-3 text-sm">
                  <dt className="text-[var(--muted)]">Account number</dt>
                  <dd className="flex items-center gap-2 font-semibold tracking-wide">
                    <span>{PAYMENT_ACCOUNT.accountNumber}</span>
                    <button
                      type="button"
                      className="rounded p-1 text-[var(--brand-pink)] hover:bg-[var(--brand-blush)]"
                      aria-label="Copy account number"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(PAYMENT_ACCOUNT.accountNumber);
                          setAccountCopied(true);
                          window.setTimeout(() => setAccountCopied(false), 1800);
                        } catch {
                          setError("Please select and copy the account number.");
                        }
                      }}
                    >
                      {accountCopied ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
                    </button>
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4 py-3 text-sm">
                  <dt className="text-[var(--muted)]">Amount to transfer</dt><dd className="font-semibold text-[var(--brand-pink)]">{formatPrice(total)}</dd>
                </div>
              </dl>
              <div className="mt-5">
                <label className="mb-1.5 block text-sm font-medium" htmlFor="paymentProof">
                  Payment screenshot <span aria-hidden="true" className="text-[var(--error)]">*</span>
                </label>
                <input
                  id="paymentProof"
                  name="paymentProof"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  required
                  className="block w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-white px-3 py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-[var(--brand-blush)] file:px-3 file:py-1.5 file:font-medium file:text-[var(--brand-pink)]"
                />
                <p className="mt-1.5 text-xs leading-5 text-[var(--muted)]">
                  JPG, PNG, or WebP up to 5 MB. Show the transfer amount and reference. Never upload a PIN, password, or OTP.
                </p>
              </div>
            </div>
          </section>

          {error && (
            <div className="p-4 rounded-[var(--radius-md)] bg-red-50 border border-red-200 text-sm text-[var(--error)]" role="alert">
              {error}
            </div>
          )}

          <div className="flex flex-col-reverse gap-3 border-t border-[var(--border)] pt-5 sm:flex-row sm:justify-between">
            {currentStep > 0 ? (
              <Button type="button" variant="outline" size="lg" onClick={() => {
                setError(null);
                setCurrentStep((step) => Math.max(step - 1, 0));
              }}>
                Back
              </Button>
            ) : <span />}
            {currentStep < CHECKOUT_STEPS.length - 1 ? (
              <Button
                key="continue-checkout"
                type="button"
                size="lg"
                className="w-full sm:w-auto"
                onClick={(event) => {
                  event.preventDefault();
                  continueToNextStep();
                }}
              >
                Continue
              </Button>
            ) : (
              <Button key="place-checkout-order" type="submit" size="lg" className="w-full sm:w-auto" disabled={loading || quoteLoading || !!quoteError || !quote}>
                {loading ? "Submitting payment…" : "Submit Payment & Place Order"}
              </Button>
            )}
          </div>
        </div>

        <div className={`lg:col-span-2 ${currentStep === 2 ? "order-1 lg:order-2" : "order-2"}`}>
          <div className="sticky top-24 p-6 rounded-[var(--radius-lg)] border border-[var(--border)] bg-white shadow-soft">
            <h2 className="font-semibold mb-4">Order Summary</h2>
            {quoteLoading && <p className="mb-3 text-sm text-[var(--muted)]" role="status">Checking current offers…</p>}
            {quoteError && <p className="mb-3 text-sm text-[var(--error)]" role="alert">{quoteError}</p>}
            <ul className="space-y-3 mb-4">
              {items.map((item) => {
                const quotedItem = quote?.items.find((line) => line.productId === item.productId);
                const price =
                  quotedItem?.unitPrice ??
                  (item.salePrice != null && item.salePrice < item.unitPrice
                    ? item.salePrice
                    : item.unitPrice);
                return (
                  <li key={item.productId} className="flex justify-between text-sm">
                    <span className="text-[var(--muted)] line-clamp-1 pr-2">
                      {item.name} × {item.quantity}
                      {quotedItem?.discountName && (
                        <span className="block text-xs text-[var(--brand-pink)]">{quotedItem.discountName}</span>
                      )}
                    </span>
                    <span className="shrink-0">{formatPrice(price * item.quantity)}</span>
                  </li>
                );
              })}
            </ul>
            <div className="mb-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Coupon code"
                  aria-label="Coupon code"
                  value={couponCode}
                  onChange={(e) => {
                    setCouponCode(e.target.value.toUpperCase());
                    setAppliedCoupon(null);
                    setCouponMessage("");
                    setCouponMessageType("");
                  }}
                  className="h-10"
                  disabled={couponLoading || loading}
                />
                <Button
                  type="button"
                  size="sm"
                  variant={appliedCoupon ? "outline" : "default"}
                  onClick={handleApplyCoupon}
                  disabled={couponLoading || loading || quoteLoading || !!quoteError || !quote}
                  className="min-w-20"
                >
                  {couponLoading || quoteLoading ? "Checking…" : appliedCoupon ? "Reapply" : "Apply"}
                </Button>
              </div>
              {couponMessage && (
                <p
                  className={`mt-2 text-sm ${
                    couponMessageType === "success" ? "text-green-700" : "text-[var(--error)]"
                  }`}
                  role="status"
                  aria-live="polite"
                >
                  {couponMessage}
                </p>
              )}
            </div>
            <div className="space-y-2 text-sm border-t border-[var(--border)] pt-3">
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              {appliedCoupon && (
                <div className="flex justify-between text-green-700">
                  <span>Coupon discount ({appliedCoupon.code})</span>
                  <span>−{formatPrice(discount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">Shipping</span>
                <span>{shipping === 0 ? "Free" : formatPrice(shipping)}</span>
              </div>
              <div className="flex justify-between font-semibold text-base pt-2">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <CartHydration>
      <CheckoutForm />
    </CartHydration>
  );
}
