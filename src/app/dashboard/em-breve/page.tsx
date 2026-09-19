import { Card } from "@/components/ui/card";

export default function EmBrevePage() {
  return (
    <div className="max-w-lg">
      <Card>
        <p className="mb-1 text-sm font-semibold text-foreground">Essa área ainda está em construção.</p>
        <p className="text-sm text-muted">
          Os painéis de Gerente de Prospector e Gerente de SDR entram nas próximas etapas da implementação.
          Fale com o administrador se precisar de algo específico por enquanto.
        </p>
      </Card>
    </div>
  );
}
