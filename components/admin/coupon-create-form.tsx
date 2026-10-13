"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { ChevronDown, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type CouponOption = {
  id: string;
  name: string;
};

type CouponCreateFormProps = {
  products: CouponOption[];
  categories: CouponOption[];
};

type CouponPayload = {
  code: string;
  type: "PERCENTAGE" | "FIXED_AMOUNT";
  value: number;
  minOrderAmount: number | null;
  maxDiscount: number | null;
  usageLimit: number | null;
  perCustomerLimit: number | null;
  startsAt: string | null;
  endsAt: string | null;
  isActive: boolean;
  eligibleProductIds: string[];
  eligibleCategoryIds: string[];
};

function SelectionList({
  label,
  description,
  items,
  searchPlaceholder,
  selected,
  onToggle,
  emptyMessage,
}: {
  label: string;
  description: string;
  items: CouponOption[];
  searchPlaceholder: string;
  selected: string[];
  onToggle: (id: string) => void;
  emptyMessage: string;
}) {
  const [query, setQuery] = useState("");
  const filteredItems = useMemo(
    () => items.filter((item) => item.name.toLocaleLowerCase().includes(query.toLocaleLowerCase())),
    [items, query],
  );

  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium">{label}</legend>
      <p className="text-xs text-[var(--muted)]">{description}</p>
      <div className="relative">
        <Search
          size={15}
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]"
        />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={searchPlaceholder}
          aria-label={`Search ${label.toLocaleLowerCase()}`}
          className="pl-9"
        />
      </div>
      <div className="max-h-44 space-y-1 overflow-y-auto rounded-[var(--radius-md)] border border-[var(--border)] bg-white p-2">
        {filteredItems.length === 0 ? (
          <p className="px-2 py-3 text-sm text-[var(--muted)]">{emptyMessage}</p>
        ) : (
          filteredItems.map((item) => (
            <label
              key={item.id}
              className="flex cursor-pointer items-center gap-2 rounded px-2 py-2 text-sm hover:bg-[var(--brand-blush)]"
            >
              <input
                type="checkbox"
                checked={selected.includes(item.id)}
                onChange={() => onToggle(item.id)}
                className="size-4 accent-[var(--brand-pink)]"
              />
              <span>{item.name}</span>
            </label>
          ))
        )}
      </div>
      <p className="text-xs text-[var(--muted)]">
        {selected.length === 0 ? "All eligible" : `${selected.length} selected`}
      </p>
    </fieldset>
  );
}

export default function CouponCreateForm({ products, categories }: CouponCreateFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingCoupon, setPendingCoupon] = useState<CouponPayload | null>(null);
  const [isReuseDialogOpen, setIsReuseDialogOpen] = useState(false);
  const [eligibleProductIds, setEligibleProductIds] = useState<string[]>([]);
  const [eligibleCategoryIds, setEligibleCategoryIds] = useState<string[]>([]);

  function toggleId(id: string, selected: string[], setSelected: (value: string[]) => void) {
    setSelected(selected.includes(id) ? selected.filter((item) => item !== id) : [...selected, id]);
  }

  async function createCoupon(payload: CouponPayload, replaceExisting = false) {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, replaceExisting }),
      });
      const result = await response.json();
      if (!response.ok) {
        if (response.status === 409 && result.code === "COUPON_EXISTS" && !replaceExisting) {
          setPendingCoupon(payload);
          setIsReuseDialogOpen(true);
          return;
        }
        setError(result.error || "Failed to create coupon.");
        return;
      }
      setIsReuseDialogOpen(false);
      router.push("/admin/coupons");
      router.refresh();
    } catch {
      setError("Unable to create coupon right now. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const rawCode = String(form.get("code") || "");
    const rawType = form.get("type");
    const payload: CouponPayload = {
      code: rawCode.trim().toUpperCase(),
      type: rawType === "FIXED_AMOUNT" ? "FIXED_AMOUNT" : "PERCENTAGE",
      value: Number(form.get("value")),
      minOrderAmount: form.get("minOrderAmount") ? Number(form.get("minOrderAmount")) : null,
      maxDiscount: form.get("maxDiscount") ? Number(form.get("maxDiscount")) : null,
      usageLimit: form.get("usageLimit") ? Number(form.get("usageLimit")) : null,
      perCustomerLimit: form.get("perCustomerLimit") ? Number(form.get("perCustomerLimit")) : null,
      startsAt: String(form.get("startsAt") || "") || null,
      endsAt: String(form.get("endsAt") || "") || null,
      isActive: form.get("isActive") === "on",
      eligibleProductIds,
      eligibleCategoryIds,
    };
    await createCoupon(payload);
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl space-y-5">
      <div>
        <label htmlFor="coupon-code" className="mb-1.5 block text-sm font-medium">Code</label>
        <Input id="coupon-code" name="code" required minLength={2} maxLength={30} placeholder="SAVE10" className="uppercase" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="coupon-type" className="mb-1.5 block text-sm font-medium">Discount type</label>
          <select id="coupon-type" name="type" className="h-11 w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-white px-3 text-sm">
            <option value="PERCENTAGE">Percentage</option>
            <option value="FIXED_AMOUNT">Fixed amount (Rs.)</option>
          </select>
        </div>
        <div>
          <label htmlFor="coupon-value" className="mb-1.5 block text-sm font-medium">Discount value</label>
          <Input id="coupon-value" name="value" type="number" required min="0.01" step="0.01" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="min-order" className="mb-1.5 block text-sm font-medium">Minimum order (optional)</label>
          <Input id="min-order" name="minOrderAmount" type="number" min="0.01" step="0.01" />
        </div>
        <div>
          <label htmlFor="max-discount" className="mb-1.5 block text-sm font-medium">Maximum discount (optional)</label>
          <Input id="max-discount" name="maxDiscount" type="number" min="0.01" step="0.01" />
        </div>
      </div>

      <div>
        <label htmlFor="usage-limit" className="mb-1.5 block text-sm font-medium">Total coupon uses (optional)</label>
        <Input id="usage-limit" name="usageLimit" type="number" min="1" step="1" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="starts-at" className="mb-1.5 block text-sm font-medium">Starts (optional)</label>
          <Input id="starts-at" name="startsAt" type="datetime-local" />
        </div>
        <div>
          <label htmlFor="ends-at" className="mb-1.5 block text-sm font-medium">Ends (optional)</label>
          <Input id="ends-at" name="endsAt" type="datetime-local" />
        </div>
      </div>

      <details className="group rounded-[var(--radius-md)] border border-[var(--border)] bg-white">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-3.5 text-sm font-semibold marker:hidden">
          <span>Advanced restrictions <span className="font-normal text-[var(--muted)]">(optional)</span></span>
          <ChevronDown size={17} aria-hidden="true" className="shrink-0 transition-transform group-open:rotate-180" />
        </summary>
        <div className="space-y-5 border-t border-[var(--border)] px-4 py-4">
          <div>
            <label htmlFor="per-customer-limit" className="mb-1.5 block text-sm font-medium">
              Uses per customer (optional)
            </label>
            <Input id="per-customer-limit" name="perCustomerLimit" type="number" min="1" step="1" className="max-w-xs" />
            <p className="mt-1 text-xs text-[var(--muted)]">
              Identified using the email entered at checkout.
            </p>
          </div>
          <SelectionList
            label="Eligible products"
            description="Leave empty to allow all products unless categories are selected."
            items={products}
            searchPlaceholder="Search products"
            selected={eligibleProductIds}
            onToggle={(id) => toggleId(id, eligibleProductIds, setEligibleProductIds)}
            emptyMessage="No active products found."
          />
          <SelectionList
            label="Eligible categories"
            description="Leave empty to allow all categories unless products are selected."
            items={categories}
            searchPlaceholder="Search categories"
            selected={eligibleCategoryIds}
            onToggle={(id) => toggleId(id, eligibleCategoryIds, setEligibleCategoryIds)}
            emptyMessage="No active categories found."
          />
          <p className="text-xs leading-5 text-[var(--muted)]">
            If you select products and/or categories, matching items are eligible. Products may qualify through either selection.
          </p>
        </div>
      </details>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="isActive" defaultChecked className="size-4 accent-[var(--brand-pink)]" />
        Active immediately (subject to start/end dates)
      </label>

      {error && !isReuseDialogOpen && (
        <p className="text-sm text-[var(--error)]" role="alert">{error}</p>
      )}
      <Button type="submit" disabled={loading}>
        {loading ? "Saving…" : "Create coupon"}
      </Button>
      <AlertDialog.Root open={isReuseDialogOpen} onOpenChange={setIsReuseDialogOpen}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 z-[100] bg-black/45 backdrop-blur-[1px]" />
          <AlertDialog.Content className="admin-dialog fixed left-1/2 top-1/2 z-[101] -translate-x-1/2 -translate-y-1/2 rounded-[var(--radius-lg)] border border-[var(--border)] bg-white p-5 shadow-2xl focus:outline-none sm:p-6">
            <AlertDialog.Title className="font-display text-xl font-semibold text-[var(--charcoal)]">
              Reuse coupon code?
            </AlertDialog.Title>
            <AlertDialog.Description className="mt-2 text-sm leading-6 text-[var(--muted)]">
              <span className="font-mono font-semibold text-[var(--brand-pink)]">{pendingCoupon?.code}</span> already exists. Reusing it replaces the current coupon settings and starts a new campaign with usage counters reset. Previous orders and their discounts remain unchanged.
            </AlertDialog.Description>
            {error && isReuseDialogOpen && (
              <p className="mt-3 text-sm text-[var(--error)]" role="alert">{error}</p>
            )}
            <div className="mt-6 flex justify-end gap-3">
              <AlertDialog.Cancel asChild>
                <Button type="button" variant="outline" disabled={loading}>Keep existing</Button>
              </AlertDialog.Cancel>
              <Button
                type="button"
                disabled={loading || !pendingCoupon}
                onClick={() => {
                  if (pendingCoupon) void createCoupon(pendingCoupon, true);
                }}
              >
                {loading ? "Saving…" : "Replace & reuse"}
              </Button>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </form>
  );
}
