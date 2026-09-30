import type { AuthContext } from "@/lib/auth/middleware";
import { dentistScope } from "@/lib/auth/access";
import { dashboardRepository } from "@/lib/repositories/dashboard.repository";
import { calcDebt, sumMoney } from "@/lib/finance";

export const dashboardService = {
  async getStats(auth: AuthContext) {
    const { patientCount, treatmentCount, appointmentCount, todayPayments, activeTreatments, recentPayments } = await dashboardRepository.getData(dentistScope(auth));
    const incomesToday = sumMoney(todayPayments.map(p => p.amount));
    const allDebtors = activeTreatments.map(patient => ({
      id: patient.id, firstName: patient.firstName, lastName: patient.lastName,
      debt: calcDebt(patient.treatments),
    })).filter(patient => patient.debt > 0).sort((a, b) => b.debt - a.debt);
    const totalOutstanding = sumMoney(allDebtors.map(patient => patient.debt));
    return { patientCount, treatmentCount, appointmentCount, incomesToday, totalOutstanding, debtors: allDebtors.slice(0, 5), recentPayments };
  },
};
