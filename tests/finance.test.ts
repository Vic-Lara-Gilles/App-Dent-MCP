import { test } from "node:test";
import assert from "node:assert/strict";
import { calcBalance, calcDebt, sumMoney } from "../lib/finance";
import { moneySchema } from "../lib/schemas";
import { dentistScope, assertOwned, assignedDentist, requireAdmin } from "../lib/auth/access";
import { ForbiddenError, NotFoundError } from "../lib/errors";
import { detectFile, filePath } from "../lib/storage/patient-files";

const dentist = { userId: "u", role: "DENTIST" as const, dentistId: "d" };
test("decimal payments reach exactly zero and sums stay exact", () => {
  assert.equal(calcBalance({ totalAmount: "0.30", payments: [{ amount: "0.10" }, { amount: "0.20" }] }), 0);
  assert.equal(sumMoney([0.1, 0.2]), 0.3);
  assert.equal(calcDebt([{ totalAmount: "1.20", payments: [{ amount: "0.10" }] }, { totalAmount: "0.20", payments: [] }]), 1.3);
});
test("money validation rejects overprecision, nonpositive and overflow", () => {
  for (const value of [0, -1, 0.001, 100000000, Infinity, NaN]) assert.equal(moneySchema.safeParse(value).success, false);
  assert.equal(moneySchema.parse("99999999.99"), 99999999.99);
});
test("missing dentist profile never expands scope to the whole clinic", () => {
  assert.throws(() => dentistScope({ ...dentist, dentistId: null }), ForbiddenError);
  assert.throws(() => assertOwned(dentist, "other", "Cita"), NotFoundError);
  assert.throws(() => assignedDentist(dentist, "other"), ForbiddenError);
  assert.throws(() => requireAdmin(dentist), ForbiddenError);
  assert.equal(assignedDentist(dentist), "d");
  assert.equal(dentistScope({ ...dentist, role: "ADMIN", dentistId: null }), undefined);
});
test("private file storage rejects traversal and disguised HTML", () => {
  assert.throws(() => filePath("../public", "id", "jpg"));
  assert.throws(() => detectFile(Buffer.from("<script>alert(1)</script>")));
  assert.equal(detectFile(Buffer.from("%PDF-1.7\n")), "pdf");
});
