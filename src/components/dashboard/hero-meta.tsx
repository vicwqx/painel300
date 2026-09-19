import { Card } from "@/components/ui/card";

export function HeroMeta({
  titulo,
  vendas,
  meta,
  projecao,
  variacaoVsAnterior,
}: {
  titulo: string;
  vendas: number;
  meta: number;
  projecao: number | null;
  variacaoVsAnterior: number | null;
}) {
  const pct = meta > 0 ? (vendas / meta) * 100 : 0;
  const faltam = Math.max(0, meta - vendas);
  const bateu = vendas >= meta;

  return (
    <Card className="relative overflow-hidden border-accent/20 bg-gradient-to-br from-surface to-surface-2 p-6 md:p-8">
      <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-accent">{titulo}</p>

      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <div className="flex items-baseline gap-2">
            <span className="font-num text-4xl font-bold text-foreground md:text-5xl">{vendas}</span>
            <span className="font-num text-xl text-muted-2">/ {meta} vendas</span>
          </div>
          <p className="mt-1 font-num text-sm font-medium text-muted">{pct.toFixed(1)}% da meta</p>
        </div>

        <div className="flex flex-col items-end gap-1 text-right">
          {bateu ? (
            <span className="rounded-md bg-positive-soft px-2.5 py-1 text-xs font-semibold text-positive">
              Meta atingida
            </span>
          ) : (
            <span className="text-sm text-muted">
              Faltam <span className="font-num font-semibold text-foreground">{faltam}</span> vendas para a meta
            </span>
          )}
          {projecao !== null && (
            <span className="text-xs text-muted-2">
              Projeção do período: <span className="font-num font-medium text-foreground">{projecao} vendas</span>
            </span>
          )}
          {variacaoVsAnterior !== null && (
            <span className={`text-xs font-medium ${variacaoVsAnterior >= 0 ? "text-positive" : "text-negative"}`}>
              {variacaoVsAnterior >= 0 ? "↑" : "↓"} {Math.abs(variacaoVsAnterior).toFixed(1)}% vs. período anterior
            </span>
          )}
        </div>
      </div>

      <div className="mt-5 h-2.5 w-full overflow-hidden rounded-full bg-surface-3">
        <div
          className="h-full rounded-full bg-accent transition-all duration-700 ease-out"
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>
    </Card>
  );
}
