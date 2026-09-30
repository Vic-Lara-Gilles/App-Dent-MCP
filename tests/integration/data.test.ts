import type { AuthContext } from "../../lib/auth/middleware";
import { test } from "node:test";
import assert from "node:assert/strict";
import { Client } from "pg";
import fs from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { randomUUID } from "node:crypto";

const databaseUrl = process.env.TEST_DATABASE_URL;
if (!databaseUrl || !new URL(databaseUrl).pathname.includes("test")) throw new Error("TEST_DATABASE_URL debe apuntar a una base exclusiva cuyo nombre contenga test");
process.env.DATABASE_URL = databaseUrl;
process.env.JWT_SECRET ??= "integration-only-secret-never-use-in-production";

const migrations = async (client: Client, includeLinks = true) => {
  const directories = (await fs.readdir("prisma/migrations", { withFileTypes: true })).filter(entry => entry.isDirectory()).sort((a, b) => a.name.localeCompare(b.name));
  for (const entry of directories) {
    if (!includeLinks && entry.name.includes("patient_dentist_links")) continue;
    await client.query(await fs.readFile(path.join("prisma/migrations", entry.name, "migration.sql"), "utf8"));
  }
};

test("migrations preserve data and backfill distinct patient links", async () => {
  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  const schema = `migration_${randomUUID().replaceAll("-", "")}`;
  try {
    await client.query(`CREATE SCHEMA "${schema}"; SET search_path TO "${schema}"`);
    await migrations(client, false);
    await client.query(`INSERT INTO "Patient" (id,"firstName","lastName",phone,"updatedAt") VALUES ('p','Shared','Patient','7654321',NOW()), ('unlinked','New','Patient','7654322',NOW());
      INSERT INTO "Dentist" (id,"firstName","lastName",phone,"updatedAt") VALUES ('a','A','Dentist','7654323',NOW()), ('b','B','Dentist','7654324',NOW());
      INSERT INTO "Treatment" (id,description,"totalAmount","patientId","dentistId","updatedAt") VALUES ('t','Test',100,'p','a',NOW());
      INSERT INTO "Payment" (id,amount,"treatmentId") VALUES ('payment',10,'t');
      INSERT INTO "Appointment" (id,title,date,duration,"patientId","dentistId","updatedAt") VALUES ('aa','Test',NOW(),30,'p','a',NOW()), ('ab','Test',NOW(),30,'p','b',NOW());`);
    await client.query(await fs.readFile("prisma/migrations/20260929000000_patient_dentist_links/migration.sql", "utf8"));
    assert.equal((await client.query('SELECT * FROM "PatientDentist"')).rowCount, 2);
    assert.equal((await client.query('SELECT * FROM "Payment"')).rowCount, 1);
    assert.equal((await client.query('SELECT * FROM "Patient"')).rowCount, 2);
  } finally {
    await client.query(`SET search_path TO public; DROP SCHEMA "${schema}" CASCADE`);
    await client.end();
  }
});

test("shared records, exact payments, concurrency, dashboard and private files", async t => {
  const { prisma } = await import("../../lib/db");
  const { patientService } = await import("../../lib/services/patient.service");
  const { treatmentService } = await import("../../lib/services/treatment.service");
  const { appointmentService } = await import("../../lib/services/appointment.service");
  const { dashboardService } = await import("../../lib/services/dashboard.service");
  const { dentistService } = await import("../../lib/services/dentist.service");
  const { photoService } = await import("../../lib/services/photo.service");
  const { ConflictError, ForbiddenError, NotFoundError } = await import("../../lib/errors");
  const { signToken } = await import("../../lib/auth/jwt");
  const prefix = randomUUID();
  const patientIds: string[] = [];
  const dentists = await Promise.all(["A", "B"].map(name => prisma.dentist.create({ data: { firstName: name, lastName: prefix, phone: `${prefix}-${name}` } })));
  const admin = { userId: `${prefix}-admin`, role: "ADMIN" as const, dentistId: null };
  const a = { userId: `${prefix}-a`, role: "DENTIST" as const, dentistId: dentists[0].id };
  const b = { userId: `${prefix}-b`, role: "DENTIST" as const, dentistId: dentists[1].id };
  t.after(async () => {
    await prisma.payment.deleteMany({ where: { treatment: { patientId: { in: patientIds } } } });
    await prisma.patient.deleteMany({ where: { id: { in: patientIds } } });
    await prisma.user.deleteMany({ where: { id: { in: [admin.userId, a.userId, b.userId] } } });
    await prisma.dentist.deleteMany({ where: { id: { in: dentists.map(dentist => dentist.id) } } });
    await prisma.$disconnect();
  });
  const createPatient = async (name: string, auth: AuthContext = a) => {
    const patient = await patientService.create({ firstName: name, lastName: prefix, phone: `${prefix}-${name}` }, auth);
    patientIds.push(patient.id); return patient;
  };
  const shared = await createPatient("shared");
  await t.test("creator retains access before operations; unrelated dentist cannot open it", async () => {
    assert.ok((await patientService.list({ search: prefix }, a)).data.some(patient => patient.id === shared.id));
    await assert.rejects(patientService.getById(shared.id, b), NotFoundError);
    await assert.rejects(patientService.list({}, { ...a, dentistId: null }), ForbiddenError);
    await assert.rejects(patientService.delete(shared.id, a), ForbiddenError);
    await assert.rejects(dentistService.create({}, a), ForbiddenError);
  });
  await patientService.setDentists(shared.id, { dentistIds: dentists.map(dentist => dentist.id) }, admin);
  const ta = await treatmentService.create({ patientId: shared.id, totalAmount: 0.3, description: "A" }, a);
  const tb = await treatmentService.create({ patientId: shared.id, totalAmount: 10, description: `foreign-treatment-${prefix}` }, b);
  const appointment = await appointmentService.create({ patientId: shared.id, title: "B only", date: new Date(), duration: 30 }, b);
  await t.test("shared clinical profile keeps financial operations and appointments scoped", async () => {
    const detailA = await patientService.getById(shared.id, a);
    const detailB = await patientService.getById(shared.id, b);
    assert.deepEqual(detailA.treatments.map(treatment => treatment.id), [ta.id]);
    assert.deepEqual(detailB.treatments.map(treatment => treatment.id), [tb.id]);
    assert.equal(detailA.appointments.length, 0);
    assert.equal(detailB.appointments[0].id, appointment.id);
    assert.equal(detailA.totalDebt, 0.3);
    assert.ok(!(await treatmentService.getOverview(a)).flatMap(group => group.treatments).some(treatment => treatment.id === tb.id));
    await assert.rejects(treatmentService.getById(tb.id, a), NotFoundError);
    await assert.rejects(treatmentService.update(tb.id, { description: "intrusion" }, a), NotFoundError);
    await assert.rejects(treatmentService.addPayment({ treatmentId: tb.id, amount: 1 }, a), NotFoundError);
    await assert.rejects(appointmentService.getById(appointment.id, a), NotFoundError);
    await assert.rejects(appointmentService.update(appointment.id, { dentistId: null }, b), ForbiddenError);
    await assert.rejects(patientService.setDentists(shared.id, { dentistIds: [dentists[0].id] }, admin), ConflictError);
    await assert.rejects(treatmentService.create({ patientId: shared.id, totalAmount: 1, description: "Spoof", dentistId: dentists[1].id }, a), ForbiddenError);
  });
  await t.test("fractional payments complete exactly and prevent deleting paid history", async () => {
    await treatmentService.addPayment({ treatmentId: ta.id, amount: 0.1 }, a);
    await treatmentService.addPayment({ treatmentId: ta.id, amount: 0.2 }, a);
    const paid = await treatmentService.getById(ta.id, a);
    assert.equal(paid.balance, 0); assert.equal(paid.status, "COMPLETED");
    await assert.rejects(treatmentService.delete(ta.id, a), ConflictError);
    await assert.rejects(patientService.delete(shared.id, admin), ConflictError);
    await assert.rejects(treatmentService.update(ta.id, { totalAmount: 0.2 }, a), ConflictError);
  });
  await t.test("concurrent payments cannot exceed the balance; updates share the lock", async () => {
    const results = await Promise.allSettled([1, 2].map(() => treatmentService.addPayment({ treatmentId: tb.id, amount: 6 }, b)));
    assert.equal(results.filter(result => result.status === "fulfilled").length, 1);
    assert.equal((await treatmentService.getById(tb.id, b)).balance, 4);
    const concurrent = await Promise.allSettled([
      treatmentService.addPayment({ treatmentId: tb.id, amount: 4 }, b),
      treatmentService.update(tb.id, { totalAmount: 5 }, b),
    ]);
    assert.equal(concurrent[0].status, "fulfilled"); assert.equal(concurrent[1].status, "rejected");
    assert.equal((await treatmentService.getById(tb.id, b)).status, "COMPLETED");
  });
  await t.test("dashboard includes debt beyond the top five and counts appointment-only patients", async () => {
    const before = await dashboardService.getStats(a);
    for (let i = 0; i < 6; i++) {
      const patient = await createPatient(`debtor-${i}`);
      await treatmentService.create({ patientId: patient.id, totalAmount: 1, description: "Debt" }, a);
    }
    const stats = await dashboardService.getStats(a);
    assert.equal(stats.totalOutstanding, before.totalOutstanding + 6);
    assert.equal(stats.debtors.length, 5);
    const patient = await createPatient("appointment-only", admin);
    await appointmentService.create({ patientId: patient.id, dentistId: a.dentistId, title: "Visit", date: new Date(), duration: 30 }, admin);
    assert.ok((await patientService.list({ search: prefix }, a)).data.some(row => row.id === patient.id));
  });
  const unlinked = await createPatient("other-only", b);
  await t.test("file content and avatar require patient access and matching file signatures", async () => {
    const form = new FormData();
    form.append("files", new File([Buffer.from("GIF89a-test-fixture")], "test.gif", { type: "image/gif" }));
    form.append("setAsAvatar", "true");
    const [photo] = await photoService.upload(shared.id, form, a);
    try {
      assert.ok(photo.url.startsWith("/api/patients/"));
      assert.equal((await photoService.getFile(shared.id, photo.id, "file.gif", b)).contentType, "image/gif");
      await assert.rejects(photoService.list(unlinked.id, a), NotFoundError);
      await assert.rejects(photoService.getFile(unlinked.id, photo.id, "file.gif", b), NotFoundError);
      assert.equal((await patientService.getById(shared.id, a)).avatarUrl, photo.url);
    } finally { await photoService.delete(shared.id, photo.id, a); }
    assert.equal((await patientService.getById(shared.id, a)).avatarUrl, null);
  });
  await t.test("legacy photos migrate and cleanup is reentrant", async () => {
    const patient = await createPatient("legacy-photo");
    const directory = path.resolve("public/uploads/patients", patient.id);
    const source = path.join(directory, "legacy.gif");
    await fs.mkdir(directory, { recursive: true });
    await fs.writeFile(source, "GIF89a-legacy-fixture");
    const photo = await prisma.patientPhoto.create({ data: { patientId: patient.id, url: `/uploads/patients/${patient.id}/legacy.gif` } });
    await prisma.patient.update({ where: { id: patient.id }, data: { avatarUrl: photo.url } });
    const run = () => promisify(execFile)(process.execPath, ["--import", "tsx", "scripts/migrate-photos.ts"], { env: { ...process.env, DATABASE_URL: databaseUrl }, timeout: 30000 });
    try {
      await run();
      const migrated = await prisma.patientPhoto.findUniqueOrThrow({ where: { id: photo.id } });
      assert.ok(migrated.url.startsWith("/api/patients/"));
      assert.equal((await patientService.getById(patient.id, a)).avatarUrl, migrated.url);
      await assert.rejects(fs.access(source));
      await fs.writeFile(source, "GIF89a-legacy-fixture"); // interrupted cleanup after DB update
      await run();
      await assert.rejects(fs.access(source));
      assert.equal((await photoService.getFile(patient.id, photo.id, "file.gif", a)).buffer.toString(), "GIF89a-legacy-fixture");
    } finally {
      await photoService.delete(patient.id, photo.id, a);
      await fs.rm(directory, { recursive: true, force: true });
    }
  });
  if (process.env.TEST_API_BASE_URL) await t.test("HTTP routes and server pages enforce the same scope", async () => {
    const base = process.env.TEST_API_BASE_URL!;
    const { hash } = await import("bcryptjs");
    await prisma.user.create({ data: { id: a.userId, email: `${prefix}@test.local`, name: "Test Dentist", role: a.role, dentistId: a.dentistId, passwordHash: await hash("test-password", 4) } });
    const login = await fetch(base + "/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: `${prefix}@test.local`, password: "test-password" }) });
    assert.equal(login.status, 200);
    assert.ok(login.headers.getSetCookie().some(value => value.startsWith("dentai-session=")));
    assert.equal((await fetch(base + "/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: `${prefix}@test.local`, password: "incorrect" }) })).status, 401);
    process.env.API_BASE_URL = base;
    process.env.MCP_EMAIL = `${prefix}@test.local`;
    process.env.MCP_PASSWORD = "test-password";
    const { apiGet } = await import("../../mcp-server/src/client");
    const mcpPatients = await apiGet<{ data: { id: string }[] }>("/api/patients");
    assert.ok(mcpPatients.data.some(patient => patient.id === shared.id));
    assert.ok(!mcpPatients.data.some(patient => patient.id === unlinked.id));

    const cookie = `dentai-session=${await signToken(a)}`;
    const call = (route: string, method = "GET", body?: unknown) => fetch(base + route, { method, headers: { Cookie: cookie, "Content-Type": "application/json" }, ...(body !== undefined ? { body: JSON.stringify(body) } : {}) });
    assert.equal((await fetch(base + "/api/patients")).status, 401);
    assert.equal((await call(`/api/patients/${unlinked.id}`)).status, 404);
    assert.equal((await call(`/api/treatments/${tb.id}`)).status, 404);
    assert.equal((await call(`/api/appointments/${appointment.id}`)).status, 404);
    assert.equal((await call(`/appointments/${appointment.id}`)).status, 404);
    const treatmentPage = await call("/treatments");
    assert.equal(treatmentPage.status, 200);
    assert.ok(!(await treatmentPage.text()).includes(tb.description));
    assert.equal((await call(`/api/patients/${shared.id}`, "DELETE")).status, 403);
    assert.equal((await call("/api/dentists", "POST", {})).status, 403);
    assert.equal((await call("/uploads/patients/fake/test.gif")).status, 404);
    assert.deepEqual(await (await call("/api/dashboard")).json(), JSON.parse(JSON.stringify(await dashboardService.getStats(a))));
    assert.equal((await call("/api/appointments?dateFrom=invalid")).status, 400);
  });
});
