"use client";

import { useState, useTransition } from "react";
import { registrarLigacoesAction } from "./lancamento/actions";
import { Button } from "@/components/ui/button";

function hojeISO() {
  return new Date().toISOString().slice(0, 10);
}

export function LigacoesWidget({ ligacoesHoje }: { ligacoesHoje: number }) {
  const [valor, setValor] = useState(String(ligacoesHoje));
  const [pending, startTransition] = useTransition();
  const [salvo, setSalvo] = useState(false);

  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        min={0}
        value={valor}
        onChange={(e) => {
          setValor(e.target.value);
          setSalvo(false);
        }}
        className="w-20 rounded-md border border-border-strong bg-surface-2 px-2 py-1.5 text-center font-num text-sm outline-none focus:border-accent"
      />
      <Button
        variant="ghost"
        disabled={pending}
        className="px-3 py-1.5 text-xs"
        onClick={() => {
          const n = parseInt(valor, 10) || 0;
          startTransition(async () => {
            await registrarLigacoesAction(hojeISO(), n);
            setSalvo(true);
          });
        }}
      >
        {pending ? "Salvando..." : salvo ? "Salvo ✓" : "Salvar ligações de hoje"}
      </Button>
    </div>
  );
}
