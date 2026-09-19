"use client";

import { useActionState, useState, useTransition } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { criarLeadAction, atualizarStatusLeadAction, type CriarLeadState } from "./actions";

type Pessoa = { id: string; nome: string };
type Lead = {
  id: string;
  profileId: string;
  nomeLead: string;
  telefone: string | null;
  placa: string | null;
  status: string;
  origemContato: string | null;
};

const STATUS_OPCOES = [
  "PRIMEIRO_CONTATO",
  "SEGUNDO_CONTATO",
  "CAIXA_POSTAL",
  "TELEFONE_INCORRETO",
  "QUALIFICADO",
  "NAO_POSSUI_CARRO",
  "POSSUI_VEICULO_E_SEGURO",
  "COTACAO",
  "WHATSAPP",
  "VENDA",
  "SEM_INTERESSE",
  "ATIVACAO",
] as const;

type StatusLeadValue = (typeof STATUS_OPCOES)[number];

const STATUS_LABEL: Record<string, string> = {
  PRIMEIRO_CONTATO: "1º Contato",
  SEGUNDO_CONTATO: "2º Contato",
  CAIXA_POSTAL: "Caixa Postal",
  TELEFONE_INCORRETO: "Telefone Incorreto",
  QUALIFICADO: "Qualificado",
  NAO_POSSUI_CARRO: "Não Possui Carro",
  POSSUI_VEICULO_E_SEGURO: "Possui Veículo e Seguro",
  COTACAO: "Cotação",
  WHATSAPP: "WhatsApp",
  VENDA: "Venda",
  SEM_INTERESSE: "Sem Interesse",
  ATIVACAO: "Ativação",
};

const STATUS_TERMINAIS = new Set(["VENDA", "SEM_INTERESSE", "TELEFONE_INCORRETO", "NAO_POSSUI_CARRO", "ATIVACAO"]);

const estadoInicial: CriarLeadState = {};

export function LeadsPanel({ pessoas, leads }: { pessoas: Pessoa[]; leads: Lead[] }) {
  const [selecionado, setSelecionado] = useState(pessoas[0]?.id ?? "");
  const [state, formAction, pending] = useActionState(criarLeadAction, estadoInicial);
  const [, startTransition] = useTransition();

  const leadsDoSelecionado = leads.filter((l) => l.profileId === selecionado);

  // gargalo por pessoa: status não-terminal com mais leads
  const gargaloPorPessoa = new Map<string, string>();
  for (const p of pessoas) {
    const contagem = new Map<string, number>();
    for (const l of leads) {
      if (l.profileId !== p.id) continue;
      if (STATUS_TERMINAIS.has(l.status)) continue;
      contagem.set(l.status, (contagem.get(l.status) ?? 0) + 1);
    }
    let maxStatus = "";
    let maxCount = 0;
    for (const [status, count] of contagem) {
      if (count > maxCount) {
        maxCount = count;
        maxStatus = status;
      }
    }
    if (maxStatus) gargaloPorPessoa.set(p.id, maxStatus);
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Visão geral de leads</CardTitle>
        </CardHeader>
        <div className="divide-y divide-border">
          {pessoas.map((p) => {
            const total = leads.filter((l) => l.profileId === p.id).length;
            const gargalo = gargaloPorPessoa.get(p.id);
            return (
              <div key={p.id} className="flex items-center gap-3 py-2 text-sm">
                <span className="flex-1">{p.nome}</span>
                <span className="text-xs text-muted">{total} lead(s)</span>
                {gargalo && <Badge tone="amber">Gargalo: {STATUS_LABEL[gargalo]}</Badge>}
              </div>
            );
          })}
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Controle de leads por executivo</CardTitle>
        </CardHeader>

        <div className="mb-4">
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted">Executivo</label>
          <select
            value={selecionado}
            onChange={(e) => setSelecionado(e.target.value)}
            className="w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-sm text-foreground outline-none focus:border-amber sm:w-64"
          >
            {pessoas.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </select>
        </div>

        <form action={formAction} className="mb-6 grid grid-cols-1 gap-3 rounded-md border border-border bg-surface-2 p-4 sm:grid-cols-5">
          <input type="hidden" name="profileId" value={selecionado} />
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs text-muted">Nome do lead</label>
            <Input name="nomeLead" required placeholder="Nome" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted">Telefone</label>
            <Input name="telefone" placeholder="(11) 90000-0000" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted">Placa</label>
            <Input name="placa" placeholder="ABC1D23" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted">Origem</label>
            <Input name="origemContato" placeholder="Lista, Indicação..." />
          </div>
          <div className="sm:col-span-5">
            {state.erro && <p className="mb-2 text-sm text-red">{state.erro}</p>}
            <Button type="submit" disabled={pending}>
              {pending ? "Adicionando..." : "Adicionar lead"}
            </Button>
          </div>
        </form>

        <div className="divide-y divide-border">
          {leadsDoSelecionado.map((l) => (
            <div key={l.id} className="flex flex-wrap items-center gap-3 py-2.5 text-sm">
              <span className="flex-1 font-medium">{l.nomeLead}</span>
              <span className="text-xs text-muted">{l.telefone ?? "—"}</span>
              <span className="text-xs text-muted">{l.placa ?? "—"}</span>
              <select
                defaultValue={l.status}
                onChange={(e) =>
                  startTransition(() => {
                    atualizarStatusLeadAction(l.id, l.status as StatusLeadValue, e.target.value as StatusLeadValue);
                  })
                }
                className="rounded-md border border-border-strong bg-surface-2 px-2 py-1 text-xs text-foreground outline-none focus:border-amber"
              >
                {STATUS_OPCOES.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABEL[s]}
                  </option>
                ))}
              </select>
            </div>
          ))}
          {leadsDoSelecionado.length === 0 && (
            <p className="py-6 text-center text-sm text-muted">Nenhum lead cadastrado pra esse executivo ainda.</p>
          )}
        </div>
      </Card>
    </div>
  );
}
