"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const OPCOES = [
  { key: "hoje", label: "Hoje" },
  { key: "7dias", label: "7 dias" },
  { key: "30dias", label: "30 dias" },
  { key: "mes", label: "Mês atual" },
  { key: "mes_passado", label: "Mês passado" },
  { key: "tudo", label: "Tudo" },
] as const;

export function PeriodPicker({
  periodoAtual,
  inicioAtual,
  fimAtual,
}: {
  periodoAtual: string;
  inicioAtual: string;
  fimAtual: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [inicio, setInicio] = useState(inicioAtual);
  const [fim, setFim] = useState(fimAtual);
  const [custom, setCustom] = useState(periodoAtual === "personalizado");

  function ir(periodo: string, extra?: { inicio?: string; fim?: string }) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("periodo", periodo);
    if (extra?.inicio) params.set("inicio", extra.inicio);
    if (extra?.fim) params.set("fim", extra.fim);
    if (periodo !== "personalizado") {
      params.delete("inicio");
      params.delete("fim");
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="inline-flex items-center rounded-lg border border-border bg-surface-2 p-0.5">
        {OPCOES.map((o) => (
          <button
            key={o.key}
            onClick={() => {
              setCustom(false);
              ir(o.key);
            }}
            className={`rounded-[6px] px-2.5 py-1.5 text-xs font-medium transition-colors ${
              periodoAtual === o.key
                ? "bg-surface text-foreground shadow-sm"
                : "text-muted hover:text-foreground"
            }`}
          >
            {o.label}
          </button>
        ))}
        <button
          onClick={() => setCustom((v) => !v)}
          className={`flex items-center gap-1 rounded-[6px] px-2.5 py-1.5 text-xs font-medium transition-colors ${
            periodoAtual === "personalizado" ? "bg-surface text-foreground shadow-sm" : "text-muted hover:text-foreground"
          }`}
        >
          <Calendar size={12} />
          Personalizado
        </button>
      </div>

      {custom && (
        <div className="flex items-center gap-2 rounded-lg border border-border bg-surface-2 p-2">
          <Input type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} className="w-auto text-xs" />
          <span className="text-xs text-muted">até</span>
          <Input type="date" value={fim} onChange={(e) => setFim(e.target.value)} className="w-auto text-xs" />
          <Button variant="ghost" className="px-2.5 py-1.5 text-xs" onClick={() => ir("personalizado", { inicio, fim })}>
            Aplicar
          </Button>
        </div>
      )}
    </div>
  );
}
