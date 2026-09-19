"use client";

import { useState, useTransition } from "react";
import { distribuirLeadAction } from "./actions";
import { Button } from "@/components/ui/button";

export function DistribuirSelect({ leadId, closers }: { leadId: string; closers: { id: string; nome: string }[] }) {
  const [closerId, setCloserId] = useState("");
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={closerId}
        onChange={(e) => setCloserId(e.target.value)}
        className="rounded-md border border-border-strong bg-surface-2 px-2 py-1.5 text-xs text-foreground outline-none focus:border-accent"
      >
        <option value="">Escolher closer...</option>
        {closers.map((c) => (
          <option key={c.id} value={c.id}>
            {c.nome}
          </option>
        ))}
      </select>
      <Button
        disabled={!closerId || pending}
        className="px-3 py-1.5 text-xs"
        onClick={() => {
          setErro(null);
          startTransition(async () => {
            try {
              await distribuirLeadAction(leadId, closerId);
            } catch (e) {
              setErro(e instanceof Error ? e.message : "Erro ao distribuir.");
            }
          });
        }}
      >
        {pending ? "Distribuindo..." : "Distribuir"}
      </Button>
      {erro && <p className="w-full text-[11px] text-red">{erro}</p>}
    </div>
  );
}
