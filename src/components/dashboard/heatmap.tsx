"use client";

export type DiaHeatmap = { dia: number; dataLabel: string; vendas: number; cotacoes: number; ligacoes: number };

export function Heatmap({ dias }: { dias: DiaHeatmap[] }) {
  const max = Math.max(1, ...dias.map((d) => d.vendas));
  return (
    <div className="grid grid-cols-10 gap-1.5">
      {dias.map((d) => {
        const ratio = d.vendas / max;
        const bg = d.vendas === 0 ? "var(--surface-3)" : `rgba(52,211,153,${(0.18 + ratio * 0.72).toFixed(2)})`;
        return (
          <div
            key={d.dia}
            title={`${d.dataLabel}\n${d.vendas} vendas · ${d.cotacoes} cotações · ${d.ligacoes} ligações`}
            className="flex aspect-square cursor-default items-center justify-center rounded font-num text-[10px] text-muted transition-transform hover:scale-110"
            style={{ background: bg }}
          >
            {d.dia}
          </div>
        );
      })}
    </div>
  );
}
