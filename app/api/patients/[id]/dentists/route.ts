import { withAuth } from "@/lib/auth/middleware";
import { patientService } from "@/lib/services/patient.service";
import { successResponse, handleApiError } from "@/lib/api-response";

export const PUT = withAuth(async (request, auth) => {
  try { return successResponse(await patientService.setDentists(auth.params!.id, await request.json(), auth)); }
  catch (error) { return handleApiError(error); }
}, ["ADMIN"]);
