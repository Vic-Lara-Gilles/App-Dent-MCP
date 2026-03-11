import { handleApiError, successResponse } from "@/lib/api-response";
import { withAuth } from "@/lib/auth";
import { ValidationError } from "@/lib/errors";
import { patientRepository } from "@/lib/repositories";
import { patientService } from "@/lib/services";
import fs from "node:fs/promises";
import path from "node:path";

const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads", "patients");
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"]);

function safeName(original: string): string {
  return original.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 100);
}

export const GET = withAuth(async (_req, { params }) => {
  try {
    const id = params!.id;
    await patientService.getById(id); // throws NotFoundError if missing
    const photos = await patientRepository.listPhotos(id);
    return successResponse(photos);
  } catch (error) {
    return handleApiError(error);
  }
});

export const POST = withAuth(async (req, { params }) => {
  try {
    const id = params!.id;
    await patientService.getById(id); // ensure patient exists

    const formData = await req.formData();
    const files = formData.getAll("files") as File[];
    const label = (formData.get("label") as string | null) ?? undefined;
    const setAsAvatar = formData.get("setAsAvatar") === "true";

    if (!files.length) throw new ValidationError("No se enviaron archivos");

    const dir = path.join(UPLOADS_DIR, id);
    await fs.mkdir(dir, { recursive: true });

    const created = [];

    for (const file of files) {
      if (!ALLOWED_MIME.has(file.type)) continue;
      if (file.size > MAX_FILE_SIZE) continue;

      const filename = `${Date.now()}-${safeName(file.name)}`;
      const filepath = path.join(dir, filename);
      const buffer = Buffer.from(await file.arrayBuffer());
      await fs.writeFile(filepath, buffer);

      const url = `/uploads/patients/${id}/${filename}`;
      const photo = await patientRepository.createPhoto(id, url, label);
      created.push(photo);
    }

    if (setAsAvatar && created.length > 0) {
      await patientService.update(id, { avatarUrl: created[0].url });
    }

    return successResponse(created, 201);
  } catch (error) {
    return handleApiError(error);
  }
});
