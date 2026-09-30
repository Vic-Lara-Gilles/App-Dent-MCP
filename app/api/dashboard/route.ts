import { withAuth } from "@/lib/auth/middleware";
import { dashboardService } from "@/lib/services/dashboard.service";
import { successResponse, handleApiError } from "@/lib/api-response";

export const GET = withAuth(async (_request, auth) => {
  try { return successResponse(await dashboardService.getStats(auth)); }
  catch (error) { return handleApiError(error); }
});
