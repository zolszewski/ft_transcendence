export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // keep equal to multer's limit

export const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];
export const PDF_TYPES = ["application/pdf"];

type Kind = "image" | "pdf";

const RULES: Record<Kind, { types: string[]; label: string }> = {
  image: { types: IMAGE_TYPES, label: "PNG, JPEG ou WebP" },
  pdf: { types: PDF_TYPES, label: "PDF" },
};

function formatMb(bytes: number) {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}


export function validateFile(file: File, kind: Kind): string | null {
  const rule = RULES[kind];
  if (!rule.types.includes(file.type)) {
    return `Invalid file type. Allowed: ${rule.label}.`;
  }
  if (file.size === 0) {
    return "Ce fichier est vide.";
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return `File is too large (${formatMb(file.size)}). Maximum is ${formatMb(MAX_UPLOAD_BYTES)}.`;
  }
  return null;
}


export async function validateFileSignature(file: File, kind: Kind): Promise<string | null> {
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const startsWith = (sig: number[], offset = 0) => sig.every((b, i) => bytes[offset + i] === b);

  let ok = false;
  if (kind === "pdf") {
    ok = startsWith([0x25, 0x50, 0x44, 0x46]); // %PDF
  } else {
    ok =
      startsWith([0x89, 0x50, 0x4e, 0x47]) || // PNG
      startsWith([0xff, 0xd8, 0xff]) || // JPEG
      (startsWith([0x52, 0x49, 0x46, 0x46]) && startsWith([0x57, 0x45, 0x42, 0x50], 8)); // RIFF....WEBP
  }
  return ok ? null : "Le contenu du fichier ne correspond pas à son type.";
}


export async function validateUpload(file: File, kind: Kind): Promise<string | null> {
  return validateFile(file, kind) ?? (await validateFileSignature(file, kind));
}