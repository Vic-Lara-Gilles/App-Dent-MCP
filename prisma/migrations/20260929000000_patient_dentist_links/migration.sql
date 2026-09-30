CREATE TABLE "PatientDentist" (
  "patientId" TEXT NOT NULL,
  "dentistId" TEXT NOT NULL,
  CONSTRAINT "PatientDentist_pkey" PRIMARY KEY ("patientId", "dentistId"),
  CONSTRAINT "PatientDentist_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "PatientDentist_dentistId_fkey" FOREIGN KEY ("dentistId") REFERENCES "Dentist"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "PatientDentist_dentistId_idx" ON "PatientDentist"("dentistId");
INSERT INTO "PatientDentist" ("patientId", "dentistId")
SELECT "patientId", "dentistId" FROM "Treatment" WHERE "dentistId" IS NOT NULL
UNION
SELECT "patientId", "dentistId" FROM "Appointment" WHERE "dentistId" IS NOT NULL;
