"use client";

import { useTransition } from "react";
import { marcarLidaAction } from "./actions";

export function MarcarLidaButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      disabled={pending}
      onClick={() => startTransition(() => marcarLidaAction(id))}
      className="shrink-0 text-[11px] text-muted hover:text-accent disabled:opacity-50"
    >
      Marcar como lida
    </button>
  );
}
