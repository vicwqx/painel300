"use client";

import { useState, useTransition } from "react";
import { redistribuirLeadAction } from "./actions";
import { Button } from "@/components/ui/button";

export function RedistribuirSelect({
  leadId,
  sdrAtualId,
  sdrs,
}: {
  leadId: string;
  sdrAtualId: string | null;
  sdrs: { id: string; nome: string }[];
}) {
  const [novoSdrId, setNovoSdrId] = useState("");
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={novoSdrId}
        onChange={(e) => setNovoSdrId(e.target.value)}
        className="rounded-md border border-border-strong bg-surface-2 px-2 py-1.5 text-xs text-foreground outline-none focus:border-accent"
      >
        <option value="">Reatribuir para...</option>
        {sdrs
          .filter((s) => s.id !== sdrAtualId)
          .map((s) => (
            <option key={s.id} value={s.id}>
              {s.nome}
            </option>
          ))}
      </select>
      <Button
        variant="ghost"
        disabled={!novoSdrId || pending}
        className="px-3 py-1.5 text-xs"
        onClick={() => {
          setErro(null);
          startTransition(async () => {
            try {
              await redistribuirLeadAction(leadId, novoSdrId);
            } catch (e) {
              setErro(e instanceof Error ? e.message : "Erro ao redistribuir.");
            }
          });
        }}
      >
        {pending ? "Movendo..." : "Redistribuir"}
      </Button>
      {erro && <p className="w-full text-[11px] text-red">{erro}</p>}
    </div>
  );
}
