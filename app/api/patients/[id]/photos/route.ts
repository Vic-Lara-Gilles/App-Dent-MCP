import { withAuth } from "@/lib/auth/middleware";
import { photoService } from "@/lib/services/photo.service";
import { successResponse, handleApiError } from "@/lib/api-response";
export const GET = withAuth(async (_request, auth) => {
  try { return successResponse(await photoService.list(auth.params!.id, auth)); }
  catch (error) { return handleApiError(error); }
});
export const POST = withAuth(async (request, auth) => {
  try { return successResponse(await photoService.upload(auth.params!.id, await request.formData(), auth), 201); }
  catch (error) { return handleApiError(error); }
});
