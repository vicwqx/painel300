"use client";

import { useState, useTransition } from "react";
import { alternarAtivoAction } from "./actions";

export function AtivoToggle({ profileId, ativoInicial }: { profileId: string; ativoInicial: boolean }) {
  const [ativo, setAtivo] = useState(ativoInicial);
  const [pending, startTransition] = useTransition();

  return (
    <button
      disabled={pending}
      onClick={() => {
        const novo = !ativo;
        setAtivo(novo);
        startTransition(() => {
          alternarAtivoAction(profileId, novo);
        });
      }}
      className={`rounded-full border px-2.5 py-0.5 text-xs font-medium transition ${
        ativo
          ? "border-teal/30 bg-teal/10 text-teal"
          : "border-border-strong bg-surface-2 text-muted"
      }`}
    >
      {ativo ? "Ativo" : "Inativo"}
    </button>
  );
}
