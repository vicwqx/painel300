"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { assumirLeadAction } from "./actions";
import { Button } from "@/components/ui/button";

export function AssumirButton({ leadId }: { leadId: string }) {
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const router = useRouter();

  return (
    <div>
      <Button
        disabled={pending}
        onClick={() => {
          setErro(null);
          startTransition(async () => {
            try {
              await assumirLeadAction(leadId);
              router.push(`/dashboard/sdr/${leadId}`);
            } catch (e) {
              setErro(e instanceof Error ? e.message : "Erro ao assumir o lead.");
            }
          });
        }}
        className="px-3 py-1.5 text-xs"
      >
        {pending ? "Assumindo..." : "Assumir lead"}
      </Button>
      {erro && <p className="mt-1 text-[11px] text-red">{erro}</p>}
    </div>
  );
}
