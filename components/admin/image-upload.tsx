"use client";

import { useRef, useState } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";

type Props = {
  imageUrls: string[];
  onChange: (imageUrls: string[]) => void;
  onUploadingChange: (uploading: boolean) => void;
};

export function ImageUpload({ imageUrls, onChange, onUploadingChange }: Props) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (!files.length) return;

    setUploading(true);
    onUploadingChange(true);
    setError(null);
    const uploadedUrls: string[] = [];

    try {
      for (const file of files) {
        const form = new FormData();
        form.append("file", file);
        const response = await fetch("/api/uploads", { method: "POST", body: form });
        const result = await response.json() as { url?: string; error?: string };
        if (!response.ok || !result.url) {
          throw new Error(result.error || `Could not upload ${file.name}.`);
        }
        uploadedUrls.push(result.url);
      }
      onChange([...imageUrls, ...uploadedUrls]);
    } catch (uploadError) {
      if (uploadedUrls.length) onChange([...imageUrls, ...uploadedUrls]);
      setError(uploadError instanceof Error ? uploadError.message : "Image upload failed.");
    } finally {
      setUploading(false);
      onUploadingChange(false);
    }
  }

  function updateUrl(index: number, value: string) {
    onChange(imageUrls.map((url, urlIndex) => urlIndex === index ? value : url));
  }

  function removeImage(index: number) {
    onChange(imageUrls.filter((_, urlIndex) => urlIndex !== index));
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="block text-sm font-medium">Product images</label>
        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          disabled={uploading}
          className="inline-flex h-9 items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--border)] px-3 text-xs font-medium transition-colors hover:bg-[var(--brand-blush)] disabled:cursor-wait disabled:opacity-60"
        >
          <ImagePlus size={15} aria-hidden="true" />
          {uploading ? "Uploading…" : "Upload images"}
        </button>
        <input
          ref={fileInput}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="sr-only"
          multiple
          onChange={handleFiles}
          disabled={uploading}
          aria-label="Choose product images to upload"
        />
      </div>

      <p className="text-xs text-[var(--muted)]">
        Add one or more product photos. The first image is used as the main image. Removed Cloudinary images are deleted when you save the product.
      </p>

      {imageUrls.length > 0 ? (
        <ul className="space-y-3">
          {imageUrls.map((url, index) => (
            <li key={`${index}-${url}`} className="flex min-w-0 items-center gap-3 rounded-xl border border-[var(--border)] bg-white p-3">
              {url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={url} alt="" loading="lazy" decoding="async" className="size-14 shrink-0 rounded-lg border border-[var(--border)] object-cover" />
              ) : (
                <span className="grid size-14 shrink-0 place-items-center rounded-lg bg-[var(--brand-cream)] text-[var(--muted)]">
                  <ImagePlus size={18} aria-hidden="true" />
                </span>
              )}
              <div className="min-w-0 flex-1">
                {index === 0 && <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-[var(--brand-pink)]">Main image</span>}
                <Input
                  type="text"
                  value={url}
                  onChange={(event) => updateUrl(index, event.target.value)}
                  placeholder="https://… image URL"
                  aria-label={`Product image ${index + 1} URL`}
                  disabled={uploading}
                />
              </div>
              <button
                type="button"
                onClick={() => removeImage(index)}
                disabled={uploading}
                aria-label={`Remove product image ${index + 1}`}
                className="grid size-9 shrink-0 place-items-center rounded-lg text-[var(--muted)] transition-colors hover:bg-red-50 hover:text-red-600 disabled:cursor-wait disabled:opacity-50"
              >
                <Trash2 size={17} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-xl border border-dashed border-[var(--border)] px-4 py-6 text-center text-sm text-[var(--muted)]">
          No product images added yet.
        </div>
      )}

      {error && <p role="alert" className="text-xs text-[var(--error)]">{error}</p>}
    </div>
  );
}
