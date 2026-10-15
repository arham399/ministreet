/**
 * Image upload via Cloudinary when configured.
 * Falls back to rejecting with clear error if not configured.
 */

export type UploadResult = {
  url: string;
  publicId?: string;
  width?: number;
  height?: number;
};

export function isCloudinaryConfigured() {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
}

function cloudinaryPublicIdFromUrl(imageUrl: string, cloudName: string) {
  try {
    const url = new URL(imageUrl);
    if (url.hostname !== "res.cloudinary.com") return null;
    const parts = url.pathname.split("/").filter(Boolean);
    if (parts[0] !== cloudName || parts[1] !== "image" || parts[2] !== "upload") return null;
    const versionIndex = parts.findIndex((part, index) => index > 2 && /^v\d+$/.test(part));
    if (versionIndex < 0) return null;
    const publicId = parts.slice(versionIndex + 1).join("/").replace(/\.[^/.]+$/, "");
    return publicId.startsWith("mini-street/products/") ? publicId : null;
  } catch {
    return null;
  }
}

export async function deleteProductImagesFromCloudinary(imageUrls: string[]) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    return { deleted: 0, skipped: imageUrls.length, failed: 0 };
  }

  let deleted = 0;
  let skipped = 0;
  let failed = 0;
  const crypto = await import("crypto");
  for (const imageUrl of imageUrls) {
    const publicId = cloudinaryPublicIdFromUrl(imageUrl, cloudName);
    if (!publicId) {
      skipped++;
      continue;
    }
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = crypto.createHash("sha1")
      .update(`public_id=${publicId}&timestamp=${timestamp}${apiSecret}`)
      .digest("hex");
    const body = new FormData();
    body.set("public_id", publicId);
    body.set("timestamp", String(timestamp));
    body.set("api_key", apiKey);
    body.set("signature", signature);
    try {
      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
        method: "POST",
        body,
        cache: "no-store",
      });
      const result = await response.json() as { result?: string };
      if (response.ok && (result.result === "ok" || result.result === "not found")) deleted++;
      else failed++;
    } catch {
      failed++;
    }
  }
  return { deleted, skipped, failed };
}

export async function uploadImage(
  buffer: Buffer,
  filename: string,
  folder = "mini-street/products"
): Promise<UploadResult> {
  if (!isCloudinaryConfigured()) {
    throw new Error(
      "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET."
    );
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME!;
  const apiKey = process.env.CLOUDINARY_API_KEY!;
  const apiSecret = process.env.CLOUDINARY_API_SECRET!;

  const crypto = await import("crypto");
  const timestamp = Math.floor(Date.now() / 1000);
  const publicId = `${folder}/${crypto.randomUUID()}-${filename.replace(/[^a-zA-Z0-9._-]/g, "")}`;

  // Signature: sha1 of sorted params + api_secret
  const toSign = `folder=${folder}&public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
  const signature = crypto.createHash("sha1").update(toSign).digest("hex");

  const form = new FormData();
  form.append("file", new Blob([new Uint8Array(buffer)]), filename);
  form.append("api_key", apiKey);
  form.append("timestamp", String(timestamp));
  form.append("signature", signature);
  form.append("folder", folder);
  form.append("public_id", publicId);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: "POST", body: form }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Cloudinary upload failed: ${err}`);
  }

  const data = await res.json();
  return {
    url: data.secure_url as string,
    publicId: data.public_id as string,
    width: data.width as number,
    height: data.height as number,
  };
}

export function validateImageFile(file: {
  size: number;
  type: string;
}): string | null {
  const maxBytes = 5 * 1024 * 1024; // 5MB
  const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!allowed.includes(file.type)) {
    return "Only JPEG, PNG, WebP, and GIF images are allowed";
  }
  if (file.size > maxBytes) {
    return "Image must be under 5MB";
  }
  return null;
}
