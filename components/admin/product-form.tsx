"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { slugify } from "@/lib/utils";
import { ImageUpload } from "@/components/admin/image-upload";

type Category = { id: string; name: string };
type ColorOption = { productId: string; name: string; hex: string };
type ProductChoice = { id: string; name: string; sku: string; colorGroupId: string | null };

const COLOR_NAME_SWATCHES: Record<string, string> = {
  gold: "#d4af37",
  golden: "#d4af37",
  "yellow gold": "#d4af37",
  "antique gold": "#a88b3d",
  "champagne gold": "#e6c77a",
  champagne: "#e6c77a",
  "rose gold": "#b76e79",
  "pink gold": "#b76e79",
  silver: "#c0c0c0",
  platinum: "#d9d6cf",
  bronze: "#cd7f32",
  copper: "#b87333",
  pink: "#ec4899",
  "light pink": "#f9a8d4",
  "baby pink": "#f4c2d7",
  "blush pink": "#e8a0a0",
  "hot pink": "#ff69b4",
  fuchsia: "#d946ef",
  rose: "#e11d48",
  red: "#ef4444",
  maroon: "#800000",
  burgundy: "#800020",
  wine: "#722f37",
  orange: "#f97316",
  yellow: "#eab308",
  green: "#22c55e",
  "dark green": "#166534",
  emerald: "#10b981",
  mint: "#98ffcc",
  olive: "#808000",
  teal: "#14b8a6",
  turquoise: "#40e0d0",
  blue: "#3b82f6",
  "light blue": "#93c5fd",
  "sky blue": "#38bdf8",
  navy: "#1e3a8a",
  purple: "#a855f7",
  lavender: "#c4b5fd",
  violet: "#8b5cf6",
  brown: "#8b5e3c",
  beige: "#d8c3a5",
  cream: "#fffdd0",
  ivory: "#fffff0",
  white: "#ffffff",
  black: "#222222",
  gray: "#808080",
  grey: "#808080",
};

function getSwatchForColorName(name: string): string | null {
  const normalized = name.trim().toLowerCase().replace(/[-_]+/g, " ").replace(/\s+/g, " ");
  if (!normalized) return null;
  if (COLOR_NAME_SWATCHES[normalized]) return COLOR_NAME_SWATCHES[normalized];

  // Also support standard CSS color names such as coral, plum, and rebeccapurple.
  if (typeof CSS === "undefined" || !CSS.supports("color", normalized)) return null;
  const context = document.createElement("canvas").getContext("2d");
  if (!context) return null;
  context.fillStyle = "#000000";
  context.fillStyle = normalized;
  const resolved = context.fillStyle;
  const rgb = resolved.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (rgb) {
    return `#${rgb.slice(1, 4).map((channel) => Number(channel).toString(16).padStart(2, "0")).join("")}`;
  }
  const hex = resolved.match(/^#([\da-f]{3}|[\da-f]{6})$/i)?.[1];
  if (!hex) return null;
  return hex.length === 3 ? `#${[...hex].map((channel) => channel + channel).join("")}` : `#${hex}`;
}

type Props = {
  categories: Category[];
  productChoices?: ProductChoice[];
  initial?: {
    id?: string;
    name: string;
    slug: string;
    sku: string;
    description?: string | null;
    price: number;
    salePrice?: number | null;
    stockQuantity: number;
    lowStockThreshold: number;
    isActive: boolean;
    isNewArrival: boolean;
    isFeatured: boolean;
    categoryId?: string | null;
    imageUrls?: string[];
    colorGroupId?: string | null;
    colorName?: string | null;
    colorHex?: string | null;
    colorOptions?: ColorOption[];
  };
};

export function ProductForm({ categories, productChoices = [], initial }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [name, setName] = useState(initial?.name || "");
  const [slug, setSlug] = useState(initial?.slug || "");
  const [imageUrls, setImageUrls] = useState(initial?.imageUrls || []);
  const [uploadingImages, setUploadingImages] = useState(false);
  const isEdit = !!initial?.id;
  const [manageColorOptions, setManageColorOptions] = useState((initial?.colorOptions?.length ?? 0) > 1);
  const [colorOptionsChanged, setColorOptionsChanged] = useState((initial?.colorOptions?.length ?? 0) > 1);
  const [colorOptions, setColorOptions] = useState<ColorOption[]>(initial?.colorOptions || []);
  const colorGroupRootId = initial?.colorGroupId || initial?.id || "";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (uploadingImages) return;
    setLoading(true);
    setError(null);
    setNotice(null);
    const form = new FormData(e.currentTarget);
    const payload = {
      name: String(form.get("name")),
      slug: String(form.get("slug")),
      sku: String(form.get("sku")),
      description: String(form.get("description") || "") || null,
      price: Number(form.get("price")),
      salePrice: form.get("salePrice") ? Number(form.get("salePrice")) : null,
      stockQuantity: Number(form.get("stockQuantity") || 0),
      lowStockThreshold: Number(form.get("lowStockThreshold") || 5),
      isActive: form.get("isActive") === "on",
      isNewArrival: form.get("isNewArrival") === "on",
      isFeatured: form.get("isFeatured") === "on",
      categoryId: String(form.get("categoryId") || "") || null,
      imageUrls: imageUrls.map((url) => url.trim()).filter(Boolean),
      ...(isEdit && colorOptionsChanged
        ? { colorOptions: manageColorOptions ? colorOptions : [] }
        : {}),
      trackInventory: true,
    };

    const url = isEdit ? `/api/products/${initial!.id}` : "/api/products";
    const method = isEdit ? "PATCH" : "POST";
    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Save failed");
        return;
      }
      if (data.warning) {
        setNotice(data.warning);
        return;
      }
      router.push("/admin/products");
      router.refresh();
    } catch {
      setError("Could not save product. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium mb-1.5">Product name</label>
          <Input
            name="name"
            required
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (!isEdit) setSlug(slugify(e.target.value));
            }}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Slug</label>
          <Input name="slug" required value={slug} onChange={(e) => setSlug(e.target.value)} />
          {!isEdit && <p className="mt-1.5 text-xs text-[var(--muted)]">If this URL is already in use, we’ll add a SKU suffix automatically.</p>}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">SKU</label>
          <Input name="sku" required defaultValue={initial?.sku} />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium mb-1.5">Description</label>
          <textarea
            name="description"
            rows={4}
            defaultValue={initial?.description || ""}
            className="flex w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-white px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Price (Rs.)</label>
          <Input name="price" type="number" step="1" required defaultValue={initial?.price} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Sale price</label>
          <Input name="salePrice" type="number" step="1" defaultValue={initial?.salePrice ?? ""} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Stock</label>
          <Input name="stockQuantity" type="number" defaultValue={initial?.stockQuantity ?? 0} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Low stock threshold</label>
          <Input name="lowStockThreshold" type="number" defaultValue={initial?.lowStockThreshold ?? 5} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Category</label>
          <select
            name="categoryId"
            defaultValue={initial?.categoryId || ""}
            className="flex h-11 w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-white px-3 text-sm"
          >
            <option value="">None</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <ImageUpload
            imageUrls={imageUrls}
            onChange={setImageUrls}
            onUploadingChange={setUploadingImages}
          />
        </div>
      </div>
      {isEdit && (
        <section className="rounded-xl border border-[var(--border)] bg-white p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-semibold">Color options</h2>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Link separate product listings so each color keeps its own SKU, photos, and stock.
              </p>
            </div>
            {manageColorOptions ? (
              <button
                type="button"
                className="text-sm text-[var(--brand-pink)] hover:underline"
                onClick={() => {
                  setManageColorOptions(false);
                  setColorOptionsChanged(true);
                }}
              >
                Remove color group
              </button>
            ) : (
              <button
                type="button"
                className="text-sm font-medium text-[var(--brand-pink)] hover:underline"
                onClick={() => {
                  setManageColorOptions(true);
                  setColorOptionsChanged(true);
                  setColorOptions([
                    {
                      productId: colorGroupRootId,
                      name: initial?.colorName || "",
                      hex: initial?.colorHex || "#d4af37",
                    },
                    { productId: "", name: "", hex: "#c0c0c0" },
                  ]);
                }}
              >
                Set up color options
              </button>
            )}
          </div>
          {manageColorOptions && (
            <div className="mt-4 space-y-3">
              {colorOptions.map((option, index) => {
                const isRoot = option.productId === colorGroupRootId;
                const selectedIds = new Set(colorOptions.map((item) => item.productId).filter(Boolean));
                return (
                  <div key={`${option.productId || "new"}-${index}`} className="grid gap-3 rounded-lg border border-[var(--border)] p-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto_auto] sm:items-end">
                    <label className="block text-sm">
                      <span className="mb-1 block text-xs text-[var(--muted)]">Product listing</span>
                      <select
                        required
                        disabled={isRoot}
                        value={option.productId}
                        onChange={(event) => setColorOptions((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, productId: event.target.value } : item))}
                        className="h-10 w-full rounded-md border border-[var(--border)] bg-white px-3 text-sm disabled:bg-[var(--brand-cream)]"
                      >
                        <option value="" disabled>Select a product</option>
                        {(productChoices || []).filter((choice) => !selectedIds.has(choice.id) || choice.id === option.productId).map((choice) => (
                          <option key={choice.id} value={choice.id}>{choice.name} · {choice.sku}</option>
                        ))}
                      </select>
                    </label>
                    <label className="block text-sm">
                      <span className="mb-1 block text-xs text-[var(--muted)]">Color name</span>
                      <Input
                        required
                        maxLength={40}
                        value={option.name}
                        placeholder="e.g. Rose gold"
                        onChange={(event) => {
                          const name = event.target.value;
                          const hex = getSwatchForColorName(name);
                          setColorOptions((items) => items.map((item, itemIndex) => itemIndex === index
                            ? { ...item, name, ...(hex ? { hex } : {}) }
                            : item));
                        }}
                      />
                    </label>
                    <label className="block text-sm">
                      <span className="mb-1 block text-xs text-[var(--muted)]">Swatch</span>
                      <input
                        type="color"
                        aria-label={`${option.name || "Color"} swatch color`}
                        value={option.hex}
                        onChange={(event) => setColorOptions((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, hex: event.target.value } : item))}
                        className="h-10 w-14 cursor-pointer rounded-md border border-[var(--border)] bg-white p-1"
                      />
                      <span className="mt-1 block text-[11px] text-[var(--muted)]">Matches the color name; adjust if needed.</span>
                    </label>
                    {!isRoot && (
                      <button
                        type="button"
                        aria-label={`Remove ${option.name || "color"} option`}
                        className="h-10 px-2 text-sm text-[var(--muted)] hover:text-[var(--error)]"
                        onClick={() => setColorOptions((items) => items.filter((_, itemIndex) => itemIndex !== index))}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                );
              })}
              <button
                type="button"
                className="text-sm font-medium text-[var(--brand-pink)] hover:underline"
                onClick={() => setColorOptions((items) => [...items, { productId: "", name: "", hex: "#c0c0c0" }])}
              >
                + Add another color
              </button>
            </div>
          )}
        </section>
      )}
      <div className="flex flex-wrap gap-4 text-sm">
        <label className="flex items-center gap-2">
          <input type="checkbox" name="isActive" defaultChecked={initial?.isActive ?? true} /> Active
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="isNewArrival" defaultChecked={initial?.isNewArrival} /> New arrival
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="isFeatured" defaultChecked={initial?.isFeatured} /> Featured
        </label>
      </div>
      {error && <p className="text-sm text-[var(--error)]">{error}</p>}
      {notice && <p role="status" className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">{notice}</p>}
      <div className="flex gap-3">
        <Button type="submit" disabled={loading || uploadingImages}>
          {uploadingImages ? "Uploading images…" : loading ? "Saving…" : isEdit ? "Update product" : "Create product"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
