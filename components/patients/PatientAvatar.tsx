"use client";

import { Camera, Loader2 } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

interface PatientAvatarProps {
  patientId: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  onSuccess: () => void;
  size?: "sm" | "md" | "lg";
}

const SIZE_CLASSES = {
  sm: "h-10 w-10 text-sm",
  md: "h-14 w-14 text-base",
  lg: "h-20 w-20 text-xl",
};

export function PatientAvatar({
  patientId,
  firstName,
  lastName,
  avatarUrl,
  onSuccess,
  size = "lg",
}: PatientAvatarProps) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const initials = `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("files", file);
      fd.append("label", "Avatar");
      fd.append("setAsAvatar", "true");

      const res = await fetch(`/api/patients/${patientId}/photos`, {
        method: "POST",
        body: fd,
      });
      if (!res.ok) throw new Error();
      toast.success("Foto de perfil actualizada");
      onSuccess();
    } catch {
      toast.error("Error al subir la imagen");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div
      className={`relative rounded-full cursor-pointer group shrink-0 ${SIZE_CLASSES[size]}`}
      onClick={() => inputRef.current?.click()}
      title="Cambiar foto de perfil"
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={`${firstName} ${lastName}`}
          className="w-full h-full rounded-full object-cover border-2 border-border"
        />
      ) : (
        <div className="w-full h-full rounded-full bg-primary/20 border-2 border-primary/30 flex items-center justify-center font-semibold text-primary select-none">
          {initials}
        </div>
      )}

      <div className="absolute inset-0 rounded-full bg-black/50 hidden group-hover:flex items-center justify-center transition-all">
        {uploading ? (
          <Loader2 className="h-4 w-4 text-white animate-spin" />
        ) : (
          <Camera className="h-4 w-4 text-white" />
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  );
}
