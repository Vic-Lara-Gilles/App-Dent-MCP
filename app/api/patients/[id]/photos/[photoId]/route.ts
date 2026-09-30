import { withAuth } from "@/lib/auth/middleware";
import { photoService } from "@/lib/services/photo.service";
import { successResponse, handleApiError } from "@/lib/api-response";
export const DELETE = withAuth(async (_request, auth) => {
  try { return successResponse(await photoService.delete(auth.params!.id, auth.params!.photoId, auth)); }
  catch (error) { return handleApiError(error); }
});
