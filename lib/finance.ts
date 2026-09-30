import { Decimal } from "@prisma/client/runtime/client";

type Money = unknown;
export function decimal(value: Money): Decimal {
  if (value === null || value === undefined) throw new TypeError("Monto requerido");
  return new Decimal(String(value));
}
export function sumMoney(values: Money[]): number {
  return values.reduce<Decimal>((sum, value) => sum.plus(decimal(value)), new Decimal(0)).toNumber();
}
export function balanceDecimal(treatment: { totalAmount: Money; payments: { amount: Money }[] }): Decimal {
  return Decimal.max(0, decimal(treatment.totalAmount).minus(
    treatment.payments.reduce((sum, payment) => sum.plus(decimal(payment.amount)), new Decimal(0)),
  ));
}
export function calcBalance(treatment: { totalAmount: Money; payments: { amount: Money }[] }): number {
  return balanceDecimal(treatment).toNumber();
}
export function calcDebt(treatments: { totalAmount: Money; payments: { amount: Money }[] }[]): number {
  return sumMoney(treatments.map(balanceDecimal));
}
