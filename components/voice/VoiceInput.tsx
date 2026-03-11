"use client";

import { Button } from "@/components/ui/button";
import { Mic, MicOff } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

interface Props {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}

export function VoiceInput({ onTranscript, disabled }: Props) {
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
    setInterim("");
  }, []);

  const start = useCallback(() => {
    const SR =
      typeof window !== "undefined"
        ? window.SpeechRecognition ?? window.webkitSpeechRecognition
        : undefined;

    if (!SR) return;

    const recognition = new SR();
    recognition.lang = "es-MX";
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      let final = "";
      let interimText = "";
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript;
        } else {
          interimText += result[0].transcript;
        }
      }
      setInterim(interimText);
      if (final) {
        onTranscript(final);
        setInterim("");
      }
    };

    recognition.onerror = () => {
      setListening(false);
      setInterim("");
    };

    recognition.onend = () => {
      setListening(false);
      setInterim("");
    };

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }, [onTranscript]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
    };
  }, []);

  const supported =
    typeof window !== "undefined" &&
    !!(window.SpeechRecognition ?? window.webkitSpeechRecognition);

  if (!supported) return null;

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant={listening ? "destructive" : "outline"}
        size="icon"
        onClick={listening ? stop : start}
        disabled={disabled}
      >
        {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
      </Button>
      {interim && (
        <span className="text-sm text-muted-foreground italic animate-pulse">
          {interim}
        </span>
      )}
    </div>
  );
}
