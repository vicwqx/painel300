"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  atualizarStatusCloserAction,
  registrarCotacaoAction,
  registrarVendaAction,
  registrarPerdidoAction,
} from "../actions";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { CrmLeadStatus } from "@prisma/client";

export function AcoesLead({ leadId, status }: { leadId: string; status: CrmLeadStatus }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  const [valorCotacao, setValorCotacao] = useState("");
  const [obsCotacao, setObsCotacao] = useState("");
  const [valorVenda, setValorVenda] = useState("");
  const [motivoPerda, setMotivoPerda] = useState("");
  const [mostrarPerda, setMostrarPerda] = useState(false);

  function rodar(acao: () => Promise<void>) {
    setErro(null);
    startTransition(async () => {
      try {
        await acao();
        router.refresh();
      } catch (e) {
        setErro(e instanceof Error ? e.message : "Erro ao atualizar.");
      }
    });
  }

  if (status === "VENDA" || status === "PERDIDO") {
    return (
      <Card>
        <p className="text-sm text-muted">
          {status === "VENDA" ? "Essa venda já foi fechada." : "Esse lead foi marcado como perdido."} Veja o
          histórico completo na página de detalhes do lead.
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ações</CardTitle>
      </CardHeader>

      <div className="space-y-5">
        {status === "DISTRIBUIDO_CLOSER" && (
          <Button disabled={pending} onClick={() => rodar(() => atualizarStatusCloserAction(leadId, "EM_CONTATO"))}>
            Registrar primeiro contato
          </Button>
        )}

        {(status === "EM_CONTATO" || status === "COTACAO" || status === "NEGOCIACAO") && (
          <div className="flex flex-wrap gap-2">
            {status === "EM_CONTATO" && (
              <Button
                variant="ghost"
                disabled={pending}
                onClick={() =>
                  rodar(() => atualizarStatusCloserAction(leadId, "RETORNO_AGENDADO"))
                }
                className="text-xs"
              >
                Agendar retorno
              </Button>
            )}
            {status !== "NEGOCIACAO" && (
              <Button
                variant="ghost"
                disabled={pending}
                onClick={() => rodar(() => atualizarStatusCloserAction(leadId, "NEGOCIACAO"))}
                className="text-xs"
              >
                Mover para negociação
              </Button>
            )}
          </div>
        )}

        {status === "RETORNO_AGENDADO" && (
          <Button disabled={pending} onClick={() => rodar(() => atualizarStatusCloserAction(leadId, "EM_CONTATO"))}>
            Retorno feito — voltar pra em contato
          </Button>
        )}

        <div className="rounded-md border border-border bg-surface-2 p-4">
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted">Registrar cotação</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input
              placeholder="Valor (opcional)"
              value={valorCotacao}
              onChange={(e) => setValorCotacao(e.target.value)}
            />
            <Input
              placeholder="Observações (opcional)"
              value={obsCotacao}
              onChange={(e) => setObsCotacao(e.target.value)}
            />
          </div>
          <Button
            variant="ghost"
            disabled={pending}
            className="mt-3 text-xs"
            onClick={() => rodar(() => registrarCotacaoAction(leadId, valorCotacao, obsCotacao))}
          >
            Enviar cotação
          </Button>
        </div>

        <div className="rounded-md border border-positive/30 bg-positive-soft p-4">
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-positive">Fechar venda</p>
          <Input placeholder="Valor da venda (opcional)" value={valorVenda} onChange={(e) => setValorVenda(e.target.value)} />
          <Button
            disabled={pending}
            className="mt-3 text-xs"
            onClick={() => {
              if (!confirm("Confirmar venda desse lead?")) return;
              rodar(() => registrarVendaAction(leadId, valorVenda));
            }}
          >
            Registrar venda
          </Button>
        </div>

        <div className="border-t border-border pt-4">
          {!mostrarPerda ? (
            <Button variant="danger" className="text-xs" onClick={() => setMostrarPerda(true)}>
              Marcar como perdido
            </Button>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <Input
                placeholder="Motivo (opcional)"
                value={motivoPerda}
                onChange={(e) => setMotivoPerda(e.target.value)}
                className="max-w-xs"
              />
              <Button
                variant="danger"
                disabled={pending}
                className="text-xs"
                onClick={() => {
                  if (!confirm("Marcar esse lead como perdido? Essa ação não pode ser desfeita.")) return;
                  rodar(() => registrarPerdidoAction(leadId, motivoPerda));
                }}
              >
                Confirmar perda
              </Button>
            </div>
          )}
        </div>

        {erro && <p className="text-sm text-red">{erro}</p>}
      </div>
    </Card>
  );
}
