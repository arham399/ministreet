import { randomUUID } from "node:crypto";

const BUCKET = "payment-proofs";
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

type ImageType = (typeof ALLOWED_TYPES)[number];

function storageConfig() {
  const baseUrl = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!baseUrl || !serviceKey) {
    throw new Error("Payment proof storage is not configured.");
  }
  return { baseUrl, serviceKey };
}

function encodePath(path: string) {
  return path.split("/").map(encodeURIComponent).join("/");
}

function extensionForImage(buffer: Buffer, declaredType: string): string | null {
  const isJpeg = buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  const isPng =
    buffer.length >= 8 &&
    buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  const isWebp =
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP";

  if (declaredType === "image/jpeg" && isJpeg) return "jpg";
  if (declaredType === "image/png" && isPng) return "png";
  if (declaredType === "image/webp" && isWebp) return "webp";
  return null;
}

export function validatePaymentProof(file: File) {
  if (!ALLOWED_TYPES.includes(file.type as ImageType)) {
    return "Upload a JPG, PNG, or WebP payment screenshot.";
  }
  if (file.size === 0 || file.size > MAX_FILE_SIZE) {
    return "The screenshot must be smaller than 5 MB.";
  }
  return null;
}

export async function uploadPaymentProof(file: File) {
  const validationError = validatePaymentProof(file);
  if (validationError) throw new Error(validationError);

  const buffer = Buffer.from(await file.arrayBuffer());
  const extension = extensionForImage(buffer, file.type);
  if (!extension) throw new Error("The uploaded file is not a valid supported image.");

  const { baseUrl, serviceKey } = storageConfig();
  const path = `orders/${new Date().toISOString().slice(0, 10)}/${randomUUID()}.${extension}`;
  const response = await fetch(
    `${baseUrl}/storage/v1/object/${BUCKET}/${encodePath(path)}`,
    {
      method: "POST",
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": file.type,
        "Cache-Control": "no-store",
        "x-upsert": "false",
      },
      body: new Uint8Array(buffer),
      cache: "no-store",
    },
  );

  if (!response.ok) {
    console.error("[payment-proof-upload] Supabase Storage rejected an upload.");
    throw new Error("We couldn't securely upload your payment screenshot. Please try again.");
  }
  return path;
}

export async function deletePaymentProof(path: string) {
  const { baseUrl, serviceKey } = storageConfig();
  const response = await fetch(`${baseUrl}/storage/v1/object/${BUCKET}`, {
    method: "DELETE",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ prefixes: [path] }),
    cache: "no-store",
  });
  if (!response.ok) {
    console.error("[payment-proof-cleanup] Could not remove an unlinked payment screenshot.");
    return false;
  }
  return true;
}

export async function createPaymentProofSignedUrl(path: string) {
  const { baseUrl, serviceKey } = storageConfig();
  const response = await fetch(
    `${baseUrl}/storage/v1/object/sign/${BUCKET}/${encodePath(path)}`,
    {
      method: "POST",
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ expiresIn: 300 }),
      cache: "no-store",
    },
  );
  if (!response.ok) throw new Error("Could not open payment proof.");
  const result = (await response.json()) as { signedURL?: string };
  if (!result.signedURL) throw new Error("Supabase did not return a signed image URL.");
  if (/^https?:\/\//i.test(result.signedURL)) return result.signedURL;
  return `${baseUrl}/storage/v1${result.signedURL.startsWith("/") ? result.signedURL : `/${result.signedURL}`}`;
}
