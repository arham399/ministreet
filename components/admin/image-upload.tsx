"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  name?: string;
  defaultValue?: string;
  onUploaded?: (url: string) => void;
};

export function ImageUpload({ name = "imageUrl", defaultValue = "", onUploaded }: Props) {
  const [url, setUrl] = useState(defaultValue);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/uploads", { method: "POST", body: form });
    const data = await res.json();
    setUploading(false);
    if (!res.ok) {
      setError(data.error || "Upload failed");
      return;
    }
    setUrl(data.url);
    onUploaded?.(data.url);
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">Product image</label>
      <Input
        name={name}
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://… or upload below"
      />
      <div className="flex items-center gap-3">
        <label className="cursor-pointer">
          <span className="inline-flex h-9 items-center rounded-[var(--radius-sm)] border border-[var(--border)] px-3 text-xs hover:bg-[var(--brand-blush)]">
            {uploading ? "Uploading…" : "Upload file"}
          </span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={handleFile}
            disabled={uploading}
          />
        </label>
        {url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="" className="h-12 w-12 object-cover rounded border border-[var(--border)]" />
        )}
      </div>
      {error && <p className="text-xs text-[var(--error)]">{error}</p>}
    </div>
  );
}
