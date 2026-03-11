-- AlterTable
ALTER TABLE "Patient" ADD COLUMN     "avatarUrl" TEXT;

-- CreateTable
CREATE TABLE "PatientPhoto" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "label" TEXT,
    "patientId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PatientPhoto_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PatientPhoto" ADD CONSTRAINT "PatientPhoto_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
