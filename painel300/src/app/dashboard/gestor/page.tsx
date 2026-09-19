import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function GestorPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Painel do gestor</h1>
        <p className="text-sm text-muted">Visão consolidada da equipe.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Em construção</CardTitle>
          <CardDescription>
            Este é o esqueleto do MVP. Os módulos avançados do painel atual (simulador de
            cenários, radar de risco, mapa de estrelados, campanhas, controle de leads) entram
            nas próximas etapas da migração, um de cada vez, sobre essa mesma base.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
