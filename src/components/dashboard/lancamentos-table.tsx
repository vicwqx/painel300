"use client";

import { useTransition } from "react";
import { excluirLancamentoAction } from "@/app/dashboard/gestor/actions";
import { Button } from "@/components/ui/button";

export type LinhaLancamento = {
  id: string;
  nome?: string;
  data: string;
  prospeccoes: number;
  indicacoes: number;
  ligacoes: number;
  atendidas: number;
  cotacoes: number;
  followup: number;
  vendas: number;
  ativas: number;
  criadoEm: string;
  atualizadoEm: string;
};

export function LancamentosTable({ linhas, mostrarNome = true }: { linhas: LinhaLancamento[]; mostrarNome?: boolean }) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead>
          <tr className="border-b border-border text-muted">
            {mostrarNome && <th className="py-2 pr-3 font-medium">Nome</th>}
            <th className="py-2 pr-3 font-medium">Data</th>
            <th className="py-2 pr-3 text-right font-medium">Prosp.</th>
            <th className="py-2 pr-3 text-right font-medium">Indic.</th>
            <th className="py-2 pr-3 text-right font-medium">Lig.</th>
            <th className="py-2 pr-3 text-right font-medium">Atend.</th>
            <th className="py-2 pr-3 text-right font-medium">Cot.</th>
            <th className="py-2 pr-3 text-right font-medium">Follow.</th>
            <th className="py-2 pr-3 text-right font-medium">Vendas</th>
            <th className="py-2 pr-3 text-right font-medium">Ativ.</th>
            <th className="py-2 pr-3 font-medium">Lançado em</th>
            <th className="py-2 pr-3 font-medium"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {linhas.map((l) => (
            <tr key={l.id}>
              {mostrarNome && <td className="py-2 pr-3 font-medium">{l.nome}</td>}
              <td className="py-2 pr-3 font-num text-muted">{l.data}</td>
              <td className="py-2 pr-3 text-right font-num">{l.prospeccoes}</td>
              <td className="py-2 pr-3 text-right font-num">{l.indicacoes}</td>
              <td className="py-2 pr-3 text-right font-num">{l.ligacoes}</td>
              <td className="py-2 pr-3 text-right font-num">{l.atendidas}</td>
              <td className="py-2 pr-3 text-right font-num">{l.cotacoes}</td>
              <td className="py-2 pr-3 text-right font-num">{l.followup}</td>
              <td className="py-2 pr-3 text-right font-num font-semibold text-teal">{l.vendas}</td>
              <td className="py-2 pr-3 text-right font-num">{l.ativas}</td>
              <td className="py-2 pr-3 text-muted">
                {new Date(l.criadoEm).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                {l.atualizadoEm !== l.criadoEm && (
                  <span className="ml-1 text-[10px] text-muted-2">
                    (editado {new Date(l.atualizadoEm).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })})
                  </span>
                )}
              </td>
              <td className="py-2">
                <Button
                  variant="danger"
                  disabled={pending}
                  onClick={() => {
                    if (!confirm(`Apagar o lançamento de ${l.nome ?? "?"} em ${l.data}?`)) return;
                    startTransition(() => {
                      excluirLancamentoAction(l.id);
                    });
                  }}
                  className="px-2 py-1 text-[10px]"
                >
                  Apagar
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {linhas.length === 0 && <p className="py-6 text-center text-sm text-muted">Nenhum lançamento encontrado.</p>}
    </div>
  );
}
