"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, PackageCheck, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ShippingSettingsFormProps = {
  initialDefaultShippingCost: number;
  initialFreeShippingThreshold: number;
  initialAnnouncementText: string;
};

function formatAmount(value: number) {
  return value.toLocaleString("en-PK", { maximumFractionDigits: 2 });
}

export function ShippingSettingsForm({
  initialDefaultShippingCost,
  initialFreeShippingThreshold,
  initialAnnouncementText,
}: ShippingSettingsFormProps) {
  const router = useRouter();
  const [defaultShippingCost, setDefaultShippingCost] = useState(String(initialDefaultShippingCost));
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(String(initialFreeShippingThreshold));
  const [announcementText, setAnnouncementText] = useState(initialAnnouncementText);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSaved(false);
    const delivery = Number(defaultShippingCost);
    const threshold = Number(freeShippingThreshold);
    if (!Number.isFinite(delivery) || delivery < 0 || !Number.isFinite(threshold) || threshold <= 0) {
      setError("Enter a valid delivery charge and a free-shipping minimum greater than zero.");
      return;
    }
    if (!announcementText.trim()) {
      setError("Enter a message for the storefront announcement bar.");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          defaultShippingCost: delivery,
          freeShippingThreshold: threshold,
          announcementText: announcementText.trim(),
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.error || "Could not save store settings.");
        return;
      }
      setSaved(true);
      router.refresh();
    } catch {
      setError("Could not save store settings. Please check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  const deliveryPreview = Number(defaultShippingCost);
  const thresholdPreview = Number(freeShippingThreshold);

  return (
    <section className="overflow-hidden rounded-3xl border border-[#efe3ea] bg-white shadow-[0_14px_40px_rgba(72,40,59,.06)]">
      <div className="border-b border-[#f2e9ee] bg-gradient-to-br from-[#fff8fc] via-white to-[#f8f2ff] px-5 py-5 sm:px-7 sm:py-6">
        <div className="flex items-start gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[#fceaf3] text-[#c2186b]">
            <Truck size={21} />
          </span>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[.18em] text-[#a17d91]">Delivery experience</p>
            <h2 className="mt-1 font-display text-xl font-semibold text-[#342a32] sm:text-2xl">Shipping &amp; delivery</h2>
            <p className="mt-1 text-sm leading-6 text-[#827680]">Set the standard delivery fee and the order value that unlocks free shipping.</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 px-5 py-5 sm:px-7 sm:py-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block min-w-0">
            <span className="mb-2 block text-sm font-semibold text-[#423640]">Default delivery charge</span>
            <span className="relative block">
              <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-sm font-medium text-[#897b85]">Rs.</span>
              <Input
                type="number"
                min="0"
                max="1000000000"
                step="0.01"
                inputMode="decimal"
                required
                value={defaultShippingCost}
                onChange={(event) => setDefaultShippingCost(event.target.value)}
                className="h-12 rounded-xl pl-12 text-base tabular-nums"
                aria-describedby="delivery-charge-help"
              />
            </span>
            <span id="delivery-charge-help" className="mt-1.5 block text-xs leading-5 text-[#91858e]">Charged when the order is below the free-delivery minimum.</span>
          </label>
          <label className="block min-w-0">
            <span className="mb-2 block text-sm font-semibold text-[#423640]">Free delivery from</span>
            <span className="relative block">
              <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-sm font-medium text-[#897b85]">Rs.</span>
              <Input
                type="number"
                min="1"
                max="1000000000"
                step="0.01"
                inputMode="decimal"
                required
                value={freeShippingThreshold}
                onChange={(event) => setFreeShippingThreshold(event.target.value)}
                className="h-12 rounded-xl pl-12 text-base tabular-nums"
                aria-describedby="free-shipping-help"
              />
            </span>
            <span id="free-shipping-help" className="mt-1.5 block text-xs leading-5 text-[#91858e]">Orders at or above this amount qualify for free delivery.</span>
          </label>
        </div>

        <div className="grid gap-3 rounded-2xl bg-[#fff8fb] p-4 sm:grid-cols-2 sm:p-5">
          <div className="flex items-start gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white text-[#c2186b] shadow-sm"><Truck size={17} /></span>
            <p className="text-sm leading-6 text-[#756872]">
              Below <strong className="font-semibold text-[#342a32]">Rs. {formatAmount(thresholdPreview || 0)}</strong>
              {": delivery is "}
              <strong className="font-semibold text-[#342a32]">Rs. {formatAmount(deliveryPreview || 0)}</strong>.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white text-[#438f80] shadow-sm"><PackageCheck size={17} /></span>
            <p className="text-sm leading-6 text-[#756872]">
              At or above <strong className="font-semibold text-[#342a32]">Rs. {formatAmount(thresholdPreview || 0)}</strong>
              {": delivery is "}
              <strong className="font-semibold text-[#438f80]">free</strong>.
            </p>
          </div>
        </div>

        {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
        <label className="block min-w-0">
          <span className="mb-2 block text-sm font-semibold text-[#423640]">Store announcement message</span>
          <Input
            type="text"
            maxLength={120}
            required
            value={announcementText}
            placeholder={initialAnnouncementText}
            onChange={(event) => setAnnouncementText(event.target.value)}
            className="h-12 rounded-xl text-base"
            aria-describedby="announcement-message-help"
          />
          <span id="announcement-message-help" className="mt-1.5 block text-xs leading-5 text-[#91858e]">
            Shown in the pink announcement bar at the top of your storefront. Maximum 120 characters.
          </span>
        </label>

        {saved && <p role="status" className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"><Check size={16} />Store settings saved. Shipping and announcement updates are live.</p>}

        <div className="flex flex-col-reverse gap-3 border-t border-[#f2e9ee] pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs leading-5 text-[#91858e]">Shipping changes apply to new carts and orders. Existing orders keep their original delivery charge.</p>
          <Button type="submit" disabled={saving} className="min-h-11 w-full px-6 sm:w-auto">
            {saving ? "Saving settings…" : "Save settings"}
          </Button>
        </div>
      </form>
    </section>
  );
}
