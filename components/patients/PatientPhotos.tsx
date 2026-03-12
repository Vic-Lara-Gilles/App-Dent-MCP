"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PatientPhoto } from "@/lib/types/patient";
import { FileText, Loader2, Plus, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

interface PatientPhotosProps {
  patientId: string;
  photos: PatientPhoto[];
  onSuccess: () => void;
}

function isPdf(url: string) {
  return url.toLowerCase().endsWith(".pdf");
}

export function PatientPhotos({ patientId, photos, onSuccess }: PatientPhotosProps) {
  const [uploading, setUploading] = useState(false);
  const [label, setLabel] = useState("");
  const [pendingFiles, setPendingFiles] = useState<FileList | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files?.length) return;
    setPendingFiles(e.target.files);
    setLabel("");
    setDialogOpen(true);
  }

  async function handleUpload() {
    if (!pendingFiles?.length) return;
    setUploading(true);
    setDialogOpen(false);
    try {
      const fd = new FormData();
      for (const f of Array.from(pendingFiles)) {
        fd.append("files", f);
      }
      if (label.trim()) fd.append("label", label.trim());

      const res = await fetch(`/api/patients/${patientId}/photos`, {
        method: "POST",
        body: fd,
      });
      if (!res.ok) throw new Error();
      toast.success(
        pendingFiles.length === 1
          ? "Archivo subido correctamente"
          : `${pendingFiles.length} archivos subidos`
      );
      onSuccess();
    } catch {
      toast.error("Error al subir archivos");
    } finally {
      setUploading(false);
      setPendingFiles(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleDelete(photo: PatientPhoto) {
    if (!confirm("¿Eliminar este archivo?")) return;
    const res = await fetch(`/api/patients/${patientId}/photos/${photo.id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      toast.success("Archivo eliminado");
      onSuccess();
    } else {
      toast.error("Error al eliminar");
    }
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Archivos del paciente</CardTitle>
          <Button
            size="sm"
            variant="outline"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <Plus className="h-4 w-4 mr-1" />
            )}
            Subir
          </Button>
        </CardHeader>
        <CardContent>
          {photos.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Sin archivos. Sube fotos de exámenes, boletas o documentos del paciente.
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {photos.map((photo) => (
                <div
                  key={photo.id}
                  className="group relative border rounded-lg overflow-hidden aspect-square bg-muted"
                >
                  {isPdf(photo.url) ? (
                    <a
                      href={photo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col items-center justify-center h-full gap-2 p-2 hover:bg-muted/80 transition-colors"
                    >
                      <FileText className="h-8 w-8 text-muted-foreground" />
                      <span className="text-xs text-center text-muted-foreground line-clamp-2">
                        {photo.label ?? "Documento PDF"}
                      </span>
                    </a>
                  ) : (
                    <a href={photo.url} target="_blank" rel="noopener noreferrer">
                      <img
                        src={photo.url}
                        alt={photo.label ?? "Imagen del paciente"}
                        className="w-full h-full object-cover hover:opacity-90 transition-opacity"
                      />
                    </a>
                  )}

                  {photo.label && !isPdf(photo.url) && (
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs px-1.5 py-1 truncate">
                      {photo.label}
                    </div>
                  )}

                  <button
                    onClick={() => handleDelete(photo)}
                    className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/80"
                    title="Eliminar archivo"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/*,application/pdf"
        className="hidden"
        onChange={handleFileChange}
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>
              Subir {pendingFiles?.length ?? 0} archivo
              {(pendingFiles?.length ?? 0) !== 1 ? "s" : ""}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div>
              <Label htmlFor="photo-label">Etiqueta (opcional)</Label>
              <Input
                id="photo-label"
                placeholder="Ej: Radiografía, Boleta, Examen periodontal…"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="mt-1"
                onKeyDown={(e) => e.key === "Enter" && handleUpload()}
              />
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {Array.from(pendingFiles ?? [])
                .map((f) => f.name)
                .join(", ")}
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpload}>Subir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
