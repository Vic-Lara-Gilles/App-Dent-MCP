"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { VoiceInput } from "@/components/voice/VoiceInput";
import { VoiceOutput } from "@/components/voice/VoiceOutput";
import { Mic, Send } from "lucide-react";
import { useCallback, useRef, useState } from "react";

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

  const processCommand = useCallback(
    async (text: string) => {
      const userMsg: Message = { id: ++idRef.current, role: "user", text };
      setMessages((prev) => [...prev, userMsg]);
      setProcessing(true);

      const reply = await interpretCommand(text);

      const assistantMsg: Message = {
        id: ++idRef.current,
        role: "assistant",
        text: reply,
      };
      setMessages((prev) => [...prev, assistantMsg]);
      setProcessing(false);
    },
    []
  );

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

async function interpretCommand(text: string): Promise<string> {
  const lower = text.toLowerCase();

  // Patient search
  if (lower.includes("busca") || lower.includes("paciente")) {
    const nameMatch = text.match(
      /(?:busca|buscar|paciente)\s+(?:a\s+)?(.+)/i
    );
    const query = nameMatch?.[1]?.trim();

    if (query) {
      const res = await fetch(
        `/api/patients?search=${encodeURIComponent(query)}`
      );
      const data = await res.json();
      if (!data.data?.length) return `No encontré pacientes con "${query}".`;
      const list = data.data
        .slice(0, 5)
        .map(
          (p: { firstName: string; lastName: string; phone: string }) =>
            `${p.firstName} ${p.lastName} (${p.phone})`
        )
        .join(", ");
      return `Encontré ${data.total} resultado(s): ${list}`;
    }
  }

  // How many patients
  if (
    lower.includes("cuántos pacientes") ||
    lower.includes("cuantos pacientes")
  ) {
    const res = await fetch("/api/patients?limit=1");
    const data = await res.json();
    return `Hay ${data.total} paciente(s) registrado(s).`;
  }

  // Appointments today
  if (lower.includes("cita") && (lower.includes("hoy") || lower.includes("hoy"))) {
    const today = new Date().toISOString().slice(0, 10);
    const res = await fetch(`/api/appointments?from=${today}&to=${today}`);
    const data = await res.json();
    return `Hay ${data.data?.length ?? 0} cita(s) para hoy.`;
  }

  // How many dentists
  if (
    lower.includes("cuántos dentistas") ||
    lower.includes("cuantos dentistas")
  ) {
    const res = await fetch("/api/dentists?limit=1");
    const data = await res.json();
    return `Hay ${data.total} dentista(s) registrado(s).`;
  }

  // Dentist search
  if (lower.includes("dentista")) {
    const nameMatch = text.match(/dentista\s+(.+)/i);
    const query = nameMatch?.[1]?.trim();
    if (query) {
      const res = await fetch(
        `/api/dentists?search=${encodeURIComponent(query)}`
      );
      const data = await res.json();
      if (!data.data?.length) return `No encontré dentistas con "${query}".`;
      const list = data.data
        .slice(0, 5)
        .map(
          (d: { firstName: string; lastName: string; specialty: string | null }) =>
            `Dr. ${d.firstName} ${d.lastName}${d.specialty ? ` (${d.specialty})` : ""}`
        )
        .join(", ");
      return `Encontré ${data.total}: ${list}`;
    }
  }

  return `No pude interpretar "${text}". Prueba con: "Busca a María", "¿Cuántos pacientes?" o "Citas de hoy".`;
}
