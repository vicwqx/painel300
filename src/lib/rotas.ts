// Área padrão de cada papel — usada tanto no redirecionamento de acesso negado
// no middleware quanto no roteamento inicial ("/"). Precisa sempre apontar pra
// uma rota que o próprio papel tem permissão de acessar (senão vira loop).
export function rotaPadraoDoPapel(papel: string): string {
  switch (papel) {
    case "ADMIN":
    case "GESTOR":
      return "/dashboard";
    case "PROSPECTOR":
      return "/dashboard/prospector";
    case "SDR":
      return "/dashboard/sdr";
    case "CLOSER":
    case "GERENTE_PROSPECTOR":
    case "GERENTE_SDR":
    case "GERENTE_CLOSER":
      return "/dashboard/em-breve";
    default:
      return "/dashboard/lancamento";
  }
}
