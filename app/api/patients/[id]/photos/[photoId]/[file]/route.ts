import { withAuth } from "@/lib/auth/middleware";
import { photoService } from "@/lib/services/photo.service";
import { handleApiError } from "@/lib/api-response";
import { NextResponse } from "next/server";
export const GET = withAuth(async (_request, auth) => {
  try {
    const { id, photoId, file } = auth.params!;
    const result = await photoService.getFile(id, photoId, file, auth);
    return new NextResponse(new Uint8Array(result.buffer), { headers: {
      "Content-Type": result.contentType, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff",
      "Content-Disposition": file.endsWith(".pdf") ? 'attachment; filename="documento.pdf"' : "inline",
    } });
  } catch (error) { return handleApiError(error); }
});
