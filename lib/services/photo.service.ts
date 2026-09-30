import { dentistScope } from "@/lib/auth/access";
import type { AuthContext } from "@/lib/auth/middleware";
import { patientService } from "./patient.service";
import { patientRepository } from "@/lib/repositories/patient.repository";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { detectFile, filePath, photoUrl, FILE_TYPES, removeFile } from "@/lib/storage/patient-files";
import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

export const photoService = {
  async list(patientId: string, auth: AuthContext) {
    await patientService.getById(patientId, auth);
    return patientRepository.listPhotos(patientId);
  },
  async upload(patientId: string, form: FormData, auth: AuthContext) {
    await patientService.getById(patientId, auth);
    const files = form.getAll("files");
    const label = form.get("label");
    if (!files.length || files.length > 20 || (label !== null && typeof label !== "string")) throw new ValidationError("Archivos o etiqueta inválidos");
    const validated = [];
    for (const file of files) {
      if (!(file instanceof File) || file.size === 0 || file.size > 10 * 1024 * 1024) throw new ValidationError("Cada archivo debe ocupar entre 1 byte y 10 MB");
      const buffer = Buffer.from(await file.arrayBuffer());
      const extension = detectFile(buffer);
      if (FILE_TYPES[extension] !== file.type) throw new ValidationError("El contenido no coincide con el tipo de archivo");
      validated.push({ buffer, extension, id: randomUUID() });
    }
    const avatar = form.get("setAsAvatar") === "true";
    if (avatar && validated[0].extension === "pdf") throw new ValidationError("El avatar debe ser una imagen");
    const paths: string[] = [];
    try {
      for (const file of validated) {
        const filepath = filePath(patientId, file.id, file.extension);
        await fs.mkdir(path.dirname(filepath), { recursive: true });
        await fs.writeFile(filepath, file.buffer, { flag: "wx" });
        paths.push(filepath);
      }
      return await patientRepository.createPhotos(patientId, validated.map(file => ({ id: file.id, url: photoUrl(patientId, file.id, file.extension), label: label || null })), avatar, dentistScope(auth));
    } catch (error) {
      await Promise.all(paths.map(removeFile));
      throw error;
    }
  },
  async getFile(patientId: string, photoId: string, file: string, auth: AuthContext) {
    await patientService.getById(patientId, auth);
    const photo = await patientRepository.findPhoto(photoId);
    if (!photo || photo.patientId !== patientId || photo.url !== `/api/patients/${patientId}/photos/${photoId}/${file}`) throw new NotFoundError("Archivo");
    const extension = file.replace(/^file\./, "");
    try { return { buffer: await fs.readFile(filePath(patientId, photoId, extension)), contentType: FILE_TYPES[extension] }; }
    catch (error) {
      if (error instanceof Error && "code" in error && error.code === "ENOENT") throw new NotFoundError("Archivo");
      throw error;
    }
  },
  async delete(patientId: string, photoId: string, auth: AuthContext) {
    await patientService.getById(patientId, auth);
    const photo = await patientRepository.findPhoto(photoId);
    if (!photo || photo.patientId !== patientId) throw new NotFoundError("Foto");
    if (!photo.url.startsWith(`/api/patients/${patientId}/photos/${photoId}/file.`)) throw new ValidationError("Migra los archivos antes de eliminarlos");
    await removeFile(filePath(patientId, photoId, photo.url.split(".").at(-1)!));
    await patientRepository.deletePhoto(photoId);
    return { message: "Archivo eliminado" };
  },
};
