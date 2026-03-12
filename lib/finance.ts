/**
 * Calculate remaining balance for a single treatment.
 * Shared across patient and treatment services (DRY).
 */
export function calcBalance(treatment: {
  totalAmount: unknown;
  payments: { amount: unknown }[];
}): number {
  const paid = treatment.payments.reduce((s, p) => s + Number(p.amount), 0);
  return Math.max(0, Number(treatment.totalAmount) - paid);
}

/**
 * Calculate total debt across multiple treatments.
 */
export function calcDebt(
  treatments: { totalAmount: unknown; payments: { amount: unknown }[] }[]
): number {
  return treatments.reduce((sum, t) => sum + calcBalance(t), 0);
}
