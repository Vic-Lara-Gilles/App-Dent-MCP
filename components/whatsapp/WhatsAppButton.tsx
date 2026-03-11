"use client";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MessageCircle } from "lucide-react";

interface Props {
  phone: string;
  message: string;
  label?: string;
  size?: "sm" | "default";
  variant?: "default" | "outline" | "ghost";
}

/** Opens WhatsApp Web (or app) with a pre-filled message via wa.me link */
export function WhatsAppButton({
  phone,
  message,
  label = "WhatsApp",
  size = "sm",
  variant = "outline",
}: Props) {
  const normalized = phone.replace(/\D/g, "");
  const href = `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(buttonVariants({ variant, size }), "text-green-700 border-green-300 hover:bg-green-50")}
    >
      <MessageCircle className="h-3 w-3 mr-1" />
      {label}
    </a>
  );
}
