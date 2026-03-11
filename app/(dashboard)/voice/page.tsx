"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { VoiceInput } from "@/components/voice/VoiceInput";
import { VoiceOutput } from "@/components/voice/VoiceOutput";
import { Mic, Send } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

interface Message {
  id: number;
  role: "user" | "assistant";
  text: string;
}

export default function VoicePage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [processing, setProcessing] = useState(false);
  const idRef = useRef(0);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const processCommand = useCallback(async (text: string) => {
    const userMsg: Message = { id: ++idRef.current, role: "user", text };
    setMessages((prev) => [...prev, userMsg]);
    setProcessing(true);

    try {
      const res = await fetch("/api/voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      const reply: string =
        data.reply ?? data.error ?? "Error al procesar la solicitud.";
      setMessages((prev) => [
        ...prev,
        { id: ++idRef.current, role: "assistant", text: reply },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: ++idRef.current,
          role: "assistant",
          text: "Error de conexión con el servidor.",
        },
      ]);
    } finally {
      setProcessing(false);
    }
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!input.trim() || processing) return;
      processCommand(input.trim());
      setInput("");
    },
    [input, processing, processCommand]
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Mic className="h-6 w-6" /> Asistente de Voz
        </h1>
        <p className="text-muted-foreground">
          Dicta comandos o escribe para consultar y gestionar datos.
        </p>
      </div>

      <Card className="min-h-100 flex flex-col">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">
            Conversación
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto space-y-3">
          {messages.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-12">
              Prueba decir: &quot;¿Cuántos pacientes hay?&quot; o &quot;Busca a
              María&quot;
            </p>
          )}
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`rounded-lg px-4 py-2 max-w-[80%] text-sm ${m.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
                  }`}
              >
                <p>{m.text}</p>
                {m.role === "assistant" && <VoiceOutput text={m.text} />}
              </div>
            </div>
          ))}
          {processing && (
            <div className="flex justify-start">
              <div className="rounded-lg px-4 py-2 bg-muted text-sm animate-pulse">
                Procesando...
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escribe un comando..."
          disabled={processing}
          className="flex-1"
        />
        <VoiceInput onTranscript={processCommand} disabled={processing} />
        <Button type="submit" disabled={processing || !input.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}

