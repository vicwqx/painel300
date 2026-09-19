import { Card } from "@/components/ui/card";

export function KpiTrend({
  label,
  valor,
  variacao,
  suffix = "",
  destaque = false,
}: {
  label: string;
  valor: number;
  variacao: number | null;
  suffix?: string;
  destaque?: boolean;
}) {
  return (
    <Card className={destaque ? "border-accent/30 bg-surface-2" : ""}>
      <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-2">{label}</p>
      <div className="flex items-baseline gap-2">
        <span className={`font-num font-semibold ${destaque ? "text-3xl text-foreground" : "text-2xl text-foreground"}`}>
          {valor.toLocaleString("pt-BR")}
          {suffix}
        </span>
        {variacao !== null && (
          <span className={`font-num text-xs font-medium ${variacao >= 0 ? "text-positive" : "text-negative"}`}>
            {variacao >= 0 ? "↑" : "↓"} {Math.abs(variacao).toFixed(1)}%
          </span>
        )}
      </div>
    </Card>
  );
}
