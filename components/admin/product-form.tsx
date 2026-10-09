"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { slugify } from "@/lib/utils";
import { ImageUpload } from "@/components/admin/image-upload";

type Category = { id: string; name: string };

type Props = {
  categories: Category[];
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
  };
};

export function ProductForm({ categories, initial }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState(initial?.name || "");
  const [slug, setSlug] = useState(initial?.slug || "");
  const isEdit = !!initial?.id;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const imageUrl = String(form.get("imageUrl") || "").trim();
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
      imageUrls: imageUrl ? [imageUrl] : [],
      trackInventory: true,
    };

    const url = isEdit ? `/api/products/${initial!.id}` : "/api/products";
    const method = isEdit ? "PATCH" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Save failed");
      setLoading(false);
      return;
    }
    router.push("/admin/products");
    router.refresh();
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
          <ImageUpload name="imageUrl" defaultValue={initial?.imageUrls?.[0] || ""} />
        </div>
      </div>
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
      <div className="flex gap-3">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving…" : isEdit ? "Update product" : "Create product"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
