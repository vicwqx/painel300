import { prisma } from "@/lib/prisma";
import { sessaoCrmObrigatoria } from "@/lib/crm/sessao";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MarcarLidaButton } from "./marcar-lida-button";
import { marcarTodasLidasAction } from "./actions";

function dataHora(d: Date) {
  return d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

export default async function NotificacoesPage() {
  const sessao = await sessaoCrmObrigatoria();

  const notificacoes = await prisma.notification.findMany({
    where: { userId: sessao.userId },
    orderBy: { criadoEm: "desc" },
    take: 50,
  });

  const naoLidas = notificacoes.filter((n) => !n.lida).length;

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Notificações</h1>
          <p className="text-sm text-muted">{naoLidas > 0 ? `${naoLidas} não lida(s)` : "Tudo em dia."}</p>
        </div>
        {naoLidas > 0 && (
          <form action={marcarTodasLidasAction}>
            <Button variant="ghost" type="submit" className="text-xs">
              Marcar todas como lidas
            </Button>
          </form>
        )}
      </div>

      <Card>
        {notificacoes.length === 0 ? (
          <p className="text-sm text-muted">Nenhuma notificação ainda.</p>
        ) : (
          <div className="divide-y divide-border">
            {notificacoes.map((n) => (
              <div key={n.id} className="flex items-start justify-between gap-3 py-3">
                <div className="flex items-start gap-2.5">
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.lida ? "bg-transparent" : "bg-accent"}`} />
                  <div>
                    <p className={`text-sm ${n.lida ? "text-muted" : "text-foreground"}`}>{n.mensagem}</p>
                    <p className="text-[11px] text-muted-2">{dataHora(n.criadoEm)}</p>
                  </div>
                </div>
                {!n.lida && <MarcarLidaButton id={n.id} />}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
