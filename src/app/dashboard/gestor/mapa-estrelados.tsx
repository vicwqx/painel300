"use client";

import { useState, useMemo } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { REGRA_ESTRELA_SEMANAL } from "@/lib/calculos/metas";

type Entrada = { profileId: string; data: string; cotacoes: number; ativas: number };
type Pessoa = { id: string; nome: string };

function isoHoje() {
  const d = new Date();
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10);
}
function segundaFeira(iso: string) {
  const d = new Date(iso + "T00:00:00");
  const dow = d.getDay();
  const diff = dow === 0 ? -6 : 1 - dow;
  d.setDate(d.getDate() + diff);
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10);
}
function somarDias(iso: string, n: number) {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + n);
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10);
}

type Periodo = "semana" | "semanaPassada" | "quinzena" | "mes";

function calcularIntervalo(periodo: Periodo): [string, string] {
  const hoje = isoHoje();
  if (periodo === "semana") {
    return [segundaFeira(hoje), hoje];
  }
  if (periodo === "semanaPassada") {
    const inicioAtual = segundaFeira(hoje);
    const inicioAnterior = somarDias(inicioAtual, -7);
    const fimAnterior = somarDias(inicioAtual, -1);
    return [inicioAnterior, fimAnterior];
  }
  if (periodo === "quinzena") {
    const dia = parseInt(hoje.slice(8, 10));
    const ym = hoje.slice(0, 7);
    if (dia <= 15) return [`${ym}-01`, hoje];
    return [`${ym}-16`, hoje];
  }
  const ym = hoje.slice(0, 7);
  return [`${ym}-01`, hoje];
}

export function MapaEstrelados({ pessoas, entradas }: { pessoas: Pessoa[]; entradas: Entrada[] }) {
  const [periodo, setPeriodo] = useState<Periodo>("semana");

  const tiles = useMemo(() => {
    const [inicio, fim] = calcularIntervalo(periodo);
    return pessoas
      .map((p) => {
        let cot = 0;
        let ativ = 0;
        for (const e of entradas) {
          if (e.profileId === p.id && e.data >= inicio && e.data <= fim) {
            cot += e.cotacoes;
            ativ += e.ativas;
          }
        }
        const atingiu = cot >= REGRA_ESTRELA_SEMANAL.cotacoes && ativ >= REGRA_ESTRELA_SEMANAL.ativas;
        const progresso = Math.min(1, (cot / REGRA_ESTRELA_SEMANAL.cotacoes + ativ / REGRA_ESTRELA_SEMANAL.ativas) / 2);
        return { nome: p.nome, cot, ativ, atingiu, progresso };
      })
      .sort((a, b) => b.progresso - a.progresso);
  }, [periodo, pessoas, entradas]);

  const totalAtingiu = tiles.filter((t) => t.atingiu).length;

  const periodos: { key: Periodo; label: string }[] = [
    { key: "semana", label: "Semana atual" },
    { key: "semanaPassada", label: "Semana passada" },
    { key: "quinzena", label: "Quinzena" },
    { key: "mes", label: "Mês" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mapa de estrelados</CardTitle>
        <p className="mt-1 text-xs text-muted">
          Regra: {REGRA_ESTRELA_SEMANAL.cotacoes} cotações e {REGRA_ESTRELA_SEMANAL.ativas} ativas no período.
        </p>
      </CardHeader>

      <div className="mb-4 flex gap-1.5">
        {periodos.map((p) => (
          <button
            key={p.key}
            onClick={() => setPeriodo(p.key)}
            className={`rounded-md border px-3 py-1.5 text-xs font-medium transition ${
              periodo === p.key
                ? "border-amber bg-surface-2 text-amber"
                : "border-border-strong text-text-2 hover:bg-surface-2"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <p className="mb-4 text-sm text-muted">
        <b className="text-foreground">
          {totalAtingiu} de {pessoas.length}
        </b>{" "}
        executivos estrelados no período.
      </p>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
        {tiles.map((t) => (
          <div
            key={t.nome}
            className={`relative rounded-md border p-3 ${t.atingiu ? "border-amber" : "border-border"}`}
            style={{
              background: t.atingiu ? "rgba(245,166,35,0.1)" : `rgba(139,148,160,${(0.03 + t.progresso * 0.12).toFixed(2)})`,
            }}
          >
            {t.atingiu && <span className="absolute right-2 top-2 text-sm">⭐</span>}
            <div className="mb-2 truncate pr-4 text-xs font-semibold">{t.nome}</div>
            <div className="text-[11px] text-muted">
              Cot. {t.cot}/{REGRA_ESTRELA_SEMANAL.cotacoes}
            </div>
            <div className="text-[11px] text-muted">
              Ativ. {t.ativ}/{REGRA_ESTRELA_SEMANAL.ativas}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
