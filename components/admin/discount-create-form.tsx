"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Option = { id: string; name: string };
type Props = { products: Option[]; categories: Option[] };
type Scope = "PRODUCT" | "CATEGORY" | "STOREWIDE";

function SelectionList({
  title,
  options,
  selected,
  onToggle,
}: {
  title: string;
  options: Option[];
  selected: string[];
  onToggle: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const matches = options.filter((option) =>
    option.name.toLocaleLowerCase().includes(query.toLocaleLowerCase()),
  );

  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium">Choose {title.toLowerCase()}</legend>
      <div className="relative">
        <Search size={15} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={`Search ${title.toLowerCase()}`}
          aria-label={`Search ${title.toLowerCase()}`}
          className="pl-9"
        />
      </div>
      <div className="max-h-48 space-y-1 overflow-y-auto rounded-[var(--radius-md)] border border-[var(--border)] bg-white p-2">
        {matches.length === 0 ? (
          <p className="px-2 py-3 text-sm text-[var(--muted)]">No matches found.</p>
        ) : matches.map((option) => (
          <label key={option.id} className="flex cursor-pointer items-center gap-2 rounded px-2 py-2 text-sm hover:bg-[var(--brand-blush)]">
            <input
              type="checkbox"
              checked={selected.includes(option.id)}
              onChange={() => onToggle(option.id)}
              className="size-4 accent-[var(--brand-pink)]"
            />
            <span>{option.name}</span>
          </label>
        ))}
      </div>
      <p className="text-xs text-[var(--muted)]">{selected.length} selected</p>
    </fieldset>
  );
}

export function DiscountCreateForm({ products, categories }: Props) {
  const router = useRouter();
  const [scope, setScope] = useState<Scope>("PRODUCT");
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [discountType, setDiscountType] = useState<"PERCENTAGE" | "FIXED_AMOUNT">("PERCENTAGE");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggle(value: string, values: string[], setValues: (items: string[]) => void) {
    setValues(values.includes(value) ? values.filter((item) => item !== value) : [...values, value]);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/discounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          type: form.get("type"),
          value: Number(form.get("value")),
          scope,
          minOrderAmount: form.get("minOrderAmount") ? Number(form.get("minOrderAmount")) : null,
          maxDiscount: form.get("maxDiscount") ? Number(form.get("maxDiscount")) : null,
          usageLimit: form.get("usageLimit") ? Number(form.get("usageLimit")) : null,
          startsAt: form.get("startsAt") ? new Date(String(form.get("startsAt"))).toISOString() : null,
          endsAt: form.get("endsAt") ? new Date(String(form.get("endsAt"))).toISOString() : null,
          isActive: form.get("isActive") === "on",
          eligibleProductIds: scope === "PRODUCT" ? selectedProducts : [],
          eligibleCategoryIds: scope === "CATEGORY" ? selectedCategories : [],
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.error || "Unable to create this discount.");
        return;
      }
      router.push("/admin/discounts");
      router.refresh();
    } catch {
      setError("Unable to create this discount right now. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl space-y-5">
      <div>
        <label htmlFor="discount-name" className="mb-1.5 block text-sm font-medium">Discount name</label>
        <Input id="discount-name" name="name" required minLength={2} maxLength={100} placeholder="Summer sparkle" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="discount-scope" className="mb-1.5 block text-sm font-medium">Applies to</label>
          <select
            id="discount-scope"
            value={scope}
            onChange={(event) => setScope(event.target.value as Scope)}
            className="h-11 w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-white px-3 text-sm"
          >
            <option value="PRODUCT">Selected products</option>
            <option value="CATEGORY">Selected categories</option>
            <option value="STOREWIDE">All products</option>
          </select>
        </div>
        <div>
          <label htmlFor="discount-type" className="mb-1.5 block text-sm font-medium">Discount type</label>
          <select
            id="discount-type"
            name="type"
            value={discountType}
            onChange={(event) => setDiscountType(event.target.value as "PERCENTAGE" | "FIXED_AMOUNT")}
            className="h-11 w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-white px-3 text-sm"
          >
            <option value="PERCENTAGE">Percentage</option>
            <option value="FIXED_AMOUNT">Fixed amount (Rs.)</option>
          </select>
        </div>
      </div>

      {scope === "PRODUCT" && (
        <SelectionList
          title="Products"
          options={products}
          selected={selectedProducts}
          onToggle={(id) => toggle(id, selectedProducts, setSelectedProducts)}
        />
      )}
      {scope === "CATEGORY" && (
        <SelectionList
          title="Categories"
          options={categories}
          selected={selectedCategories}
          onToggle={(id) => toggle(id, selectedCategories, setSelectedCategories)}
        />
      )}
      {scope === "STOREWIDE" && (
        <p className="rounded-[var(--radius-md)] bg-[var(--brand-blush)] p-3 text-sm text-[var(--muted)]">
          This discount will apply automatically to every eligible product.
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="discount-value" className="mb-1.5 block text-sm font-medium">Discount value</label>
          <Input id="discount-value" name="value" type="number" required min="0.01" max={discountType === "PERCENTAGE" ? 100 : undefined} step="0.01" />
          <p className="mt-1 text-xs text-[var(--muted)]">Percentage discounts can be up to 100%.</p>
        </div>
        <div>
          <label htmlFor="discount-max" className="mb-1.5 block text-sm font-medium">Maximum discount per item (optional)</label>
          <Input id="discount-max" name="maxDiscount" type="number" min="0.01" step="0.01" placeholder="Rs." />
        </div>
        <div>
          <label htmlFor="discount-min-order" className="mb-1.5 block text-sm font-medium">Minimum cart subtotal (optional)</label>
          <Input id="discount-min-order" name="minOrderAmount" type="number" min="0.01" step="0.01" placeholder="Rs." />
        </div>
        <div>
          <label htmlFor="discount-usage-limit" className="mb-1.5 block text-sm font-medium">Total uses (optional)</label>
          <Input id="discount-usage-limit" name="usageLimit" type="number" min="1" step="1" />
        </div>
        <div>
          <label htmlFor="discount-starts-at" className="mb-1.5 block text-sm font-medium">Starts (optional)</label>
          <Input id="discount-starts-at" name="startsAt" type="datetime-local" />
        </div>
        <div>
          <label htmlFor="discount-ends-at" className="mb-1.5 block text-sm font-medium">Ends (optional)</label>
          <Input id="discount-ends-at" name="endsAt" type="datetime-local" />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="isActive" defaultChecked className="size-4 accent-[var(--brand-pink)]" />
        Activate immediately
      </label>
      {error && <p className="text-sm text-[var(--error)]" role="alert">{error}</p>}
      <Button type="submit" disabled={loading}>
        {loading ? "Saving…" : "Create discount"}
      </Button>
    </form>
  );
}
