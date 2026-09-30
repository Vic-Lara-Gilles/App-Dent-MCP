import { existsSync } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
if (existsSync(".env")) process.loadEnvFile(".env");

async function main() {
  const { prisma } = await import("../lib/db");
  const { detectFile, filePath, photoUrl, removeFile } = await import("../lib/storage/patient-files");
  try {
    const photos = await prisma.patientPhoto.findMany();
    for (const photo of photos) {
      if (!photo.url.startsWith("/uploads/patients/")) continue;
      const legacy = path.resolve("public", `.${photo.url}`);
      const expectedDirectory = path.resolve("public/uploads/patients", photo.patientId);
      if (path.dirname(legacy) !== expectedDirectory) throw new Error(`Ruta inválida: ${photo.id}`);
      const buffer = await fs.readFile(legacy);
      const extension = detectFile(buffer);
      const target = filePath(photo.patientId, photo.id, extension);
      await fs.mkdir(path.dirname(target), { recursive: true });
      if (!existsSync(target)) await fs.writeFile(target, buffer, { flag: "wx" });
      if (!(await fs.readFile(target)).equals(buffer)) throw new Error(`Copia no coincide: ${photo.id}`);
      const url = photoUrl(photo.patientId, photo.id, extension);
      await prisma.$transaction(async tx => {
        await tx.patientPhoto.update({ where: { id: photo.id }, data: { url } });
        await tx.patient.updateMany({ where: { id: photo.patientId, avatarUrl: photo.url }, data: { avatarUrl: url } });
      });
      await removeFile(legacy);
    }
    // Recover cleanup if a previous run stopped after updating the database.
    const migrated = await prisma.patientPhoto.findMany({ where: { url: { startsWith: "/api/patients/" } } });
    for (const photo of migrated) {
      const directory = path.resolve("public/uploads/patients", photo.patientId);
      if (!existsSync(directory)) continue;
      const buffer = await fs.readFile(filePath(photo.patientId, photo.id, photo.url.split(".").at(-1)!));
      for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
        if (!entry.isFile()) continue;
        const legacy = path.join(directory, entry.name);
        if ((await fs.readFile(legacy)).equals(buffer)) await removeFile(legacy);
      }
    }
    console.log("Migración de archivos completada. Puedes volver a ejecutarla.");
  } finally { await prisma.$disconnect(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
