"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ArrowUpDown } from "lucide-react";

export type LinhaRanking = {
  id: string;
  nome: string;
  vendas: number;
  cotacoes: number;
  ligacoes: number;
  metaIndividual: number;
};

type Coluna = "vendas" | "cotacoes" | "ligacoes" | "meta";

const COLUNAS: { key: Coluna; label: string }[] = [
  { key: "vendas", label: "Vendas" },
  { key: "cotacoes", label: "Cotações" },
  { key: "ligacoes", label: "Ligações" },
  { key: "meta", label: "% da meta" },
];

export function RankingTable({ linhas }: { linhas: LinhaRanking[] }) {
  const [ordenarPor, setOrdenarPor] = useState<Coluna>("vendas");

  const ordenadas = useMemo(() => {
    const copia = [...linhas];
    copia.sort((a, b) => {
      if (ordenarPor === "meta") {
        const pctA = a.metaIndividual > 0 ? a.vendas / a.metaIndividual : 0;
        const pctB = b.metaIndividual > 0 ? b.vendas / b.metaIndividual : 0;
        return pctB - pctA;
      }
      return b[ordenarPor] - a[ordenarPor];
    });
    return copia;
  }, [linhas, ordenarPor]);

  const maxVendas = Math.max(1, ...linhas.map((l) => l.vendas));

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-muted-2">
            <th className="w-10 py-2 font-medium">#</th>
            <th className="py-2 font-medium">Executivo</th>
            {COLUNAS.map((c) => (
              <th key={c.key} className="py-2 text-right font-medium">
                <button
                  onClick={() => setOrdenarPor(c.key)}
                  className={`inline-flex items-center gap-1 transition-colors hover:text-foreground ${
                    ordenarPor === c.key ? "text-accent" : ""
                  }`}
                >
                  {c.label}
                  <ArrowUpDown size={11} />
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ordenadas.map((l, i) => {
            const pctMeta = l.metaIndividual > 0 ? (l.vendas / l.metaIndividual) * 100 : 0;
            const pctBarra = (l.vendas / maxVendas) * 100;
            return (
              <tr key={l.id} className="group border-b border-border/60 transition-colors hover:bg-surface-2">
                <td className="py-2.5 pr-2">
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-md font-num text-[11px] font-semibold ${
                      i === 0 ? "bg-accent-soft text-accent-strong" : "bg-surface-3 text-muted"
                    }`}
                  >
                    {i + 1}
                  </span>
                </td>
                <td className="py-2.5 pr-3">
                  <Link href={`/dashboard/vendedor/${l.id}`} className="font-medium text-foreground hover:text-accent hover:underline">
                    {l.nome}
                  </Link>
                  <div className="mt-1 h-1 w-28 overflow-hidden rounded-full bg-surface-3">
                    <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${pctBarra}%` }} />
                  </div>
                </td>
                <td className="py-2.5 text-right font-num font-semibold text-foreground">{l.vendas}</td>
                <td className="py-2.5 text-right font-num text-muted">{l.cotacoes}</td>
                <td className="py-2.5 text-right font-num text-muted">{l.ligacoes}</td>
                <td className="py-2.5 text-right font-num">
                  <span className={pctMeta >= 100 ? "text-positive" : "text-muted"}>{pctMeta.toFixed(0)}%</span>
                </td>
              </tr>
            );
          })}
          {ordenadas.length === 0 && (
            <tr>
              <td colSpan={6} className="py-8 text-center text-sm text-muted">
                Nenhum executivo cadastrado ainda.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
