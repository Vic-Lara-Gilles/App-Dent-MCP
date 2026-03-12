import { handleApiError, successResponse } from "@/lib/api-response";
import { withAuth } from "@/lib/auth";
import { NotFoundError } from "@/lib/errors";
import { patientRepository } from "@/lib/repositories/patient.repository";
import { patientService } from "@/lib/services/patient.service";
import fs from "node:fs/promises";
import path from "node:path";

const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads", "patients");

export const DELETE = withAuth(async (_req, { params }) => {
  try {
    const { id, photoId } = params!;

    const photo = await patientRepository.findPhoto(photoId);
    if (!photo || photo.patientId !== id) throw new NotFoundError("Foto");

    // Remove file from disk (non-fatal if already gone)
    const relative = photo.url.replace(/^\/uploads\/patients\/[^/]+\//, "");
    const filepath = path.join(UPLOADS_DIR, id, relative);
    await fs.unlink(filepath).catch(() => null);

    // If this was the avatar, clear it
    const patient = await patientService.getById(id);
    if (patient.avatarUrl === photo.url) {
      await patientService.update(id, { avatarUrl: null });
    }

    await patientRepository.deletePhoto(photoId);
    return successResponse({ message: "Foto eliminada" });
  } catch (error) {
    return handleApiError(error);
  }
});
