"use client";

import { Button } from "@/components/ui/button";
import { Volume2, VolumeX } from "lucide-react";
import { useCallback, useRef, useState } from "react";

interface Props {
  text: string;
}

export function VoiceOutput({ text }: Props) {
  const [speaking, setSpeaking] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }, []);

  const speak = useCallback(() => {
    if (!text || !window.speechSynthesis) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "es-MX";
    utterance.rate = 1;

    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setSpeaking(true);
  }, [text]);

  const supported =
    typeof window !== "undefined" && !!window.speechSynthesis;

  if (!supported || !text) return null;

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={speaking ? stop : speak}
      title={speaking ? "Detener" : "Escuchar"}
    >
      {speaking ? (
        <VolumeX className="h-4 w-4" />
      ) : (
        <Volume2 className="h-4 w-4" />
      )}
    </Button>
  );
}
