"use client";

type Estagio = { label: string; valor: number };

export function FunnelChart({
  prospeccoes,
  ligacoes,
  cotacoes,
  vendas,
}: {
  prospeccoes: number;
  ligacoes: number;
  cotacoes: number;
  vendas: number;
}) {
  const estagios: Estagio[] = [
    { label: "Prospecções", valor: prospeccoes },
    { label: "Ligações", valor: ligacoes },
    { label: "Cotações", valor: cotacoes },
    { label: "Vendas", valor: vendas },
  ];
  const max = Math.max(1, ...estagios.map((e) => e.valor));

  return (
    <div className="space-y-1">
      {estagios.map((e, i) => {
        const pctDaBase = max > 0 ? (e.valor / max) * 100 : 0;
        const anterior = i > 0 ? estagios[i - 1].valor : null;
        const pctConversao = anterior && anterior > 0 ? ((e.valor / anterior) * 100).toFixed(1) : null;

        return (
          <div key={e.label}>
            {i > 0 && pctConversao && (
              <div className="flex items-center gap-2 py-1 pl-1 text-[11px] text-muted-2">
                <span>↓</span>
                <span>{pctConversao}% avançam da etapa anterior</span>
              </div>
            )}
            <div className="flex items-center gap-3">
              <div className="w-24 shrink-0 text-xs font-medium uppercase tracking-wide text-muted">{e.label}</div>
              <div className="relative h-8 flex-1 overflow-hidden rounded-md bg-surface-2">
                <div
                  className="flex h-full items-center rounded-md bg-accent/25 pl-3 transition-all duration-500"
                  style={{ width: `${Math.max(6, pctDaBase)}%` }}
                >
                  <span className="font-num text-xs font-semibold text-foreground">{e.valor.toLocaleString("pt-BR")}</span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
      <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-xs">
        <span className="text-muted">Conversão geral (prospecção → venda)</span>
        <span className="font-num font-semibold text-foreground">
          {prospeccoes > 0 ? ((vendas / prospeccoes) * 100).toFixed(1) : "0.0"}%
        </span>
      </div>
    </div>
  );
}
