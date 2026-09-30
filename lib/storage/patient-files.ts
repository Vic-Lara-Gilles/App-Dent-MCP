import fs from "node:fs/promises";
import path from "node:path";
import { ValidationError } from "@/lib/errors";

export const UPLOADS_DIR = path.resolve(process.env.UPLOADS_DIR || "storage/patients");
export const FILE_TYPES: Record<string, string> = { jpg: "image/jpeg", png: "image/png", webp: "image/webp", gif: "image/gif", pdf: "application/pdf" };
export function detectFile(buffer: Buffer): string {
  if (buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) return "jpg";
  if (buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return "png";
  if (["GIF87a", "GIF89a"].includes(buffer.subarray(0, 6).toString())) return "gif";
  if (buffer.subarray(0, 4).toString() === "RIFF" && buffer.subarray(8, 12).toString() === "WEBP") return "webp";
  if (buffer.subarray(0, 5).toString() === "%PDF-") return "pdf";
  throw new ValidationError("Tipo de archivo no permitido");
}
export function photoUrl(patientId: string, photoId: string, extension: string): string {
  return `/api/patients/${patientId}/photos/${photoId}/file.${extension}`;
}
export function filePath(patientId: string, photoId: string, extension: string): string {
  if (!/^[a-zA-Z0-9_-]+$/.test(patientId) || !/^[a-zA-Z0-9_-]+$/.test(photoId) || !FILE_TYPES[extension]) throw new ValidationError("Archivo inválido");
  return path.join(UPLOADS_DIR, patientId, `${photoId}.${extension}`);
}
export async function removeFile(filepath: string): Promise<void> {
  try { await fs.unlink(filepath); } catch (error) {
    if (!(error instanceof Error && "code" in error && error.code === "ENOENT")) throw error;
  }
}
