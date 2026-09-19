import type { CrmLeadStatus, Temperatura } from "@prisma/client";

export const STATUS_LABEL: Record<CrmLeadStatus, string> = {
  NOVO: "Novo",
  PROSPECCAO: "Prospecção",
  AGUARDANDO_SDR: "Aguardando SDR",
  EM_QUALIFICACAO: "Em qualificação",
  QUALIFICADO: "Qualificado",
  AGUARDANDO_CLOSER: "Aguardando distribuição",
  DISTRIBUIDO_CLOSER: "Distribuído ao closer",
  EM_CONTATO: "Em contato",
  COTACAO: "Cotação",
  NEGOCIACAO: "Negociação",
  VENDA: "Venda",
  PERDIDO: "Perdido",
  SEM_CONTATO: "Sem contato",
  NUMERO_INVALIDO: "Número inválido",
  SEM_INTERESSE: "Sem interesse",
  DUPLICADO: "Duplicado",
  FORA_PERFIL: "Fora do perfil",
  RETORNO_AGENDADO: "Retorno agendado",
};

// Tom do Badge (@/components/ui/badge) pra cada status.
export const STATUS_TONE: Record<CrmLeadStatus, "teal" | "amber" | "red" | "neutral"> = {
  NOVO: "neutral",
  PROSPECCAO: "neutral",
  AGUARDANDO_SDR: "amber",
  EM_QUALIFICACAO: "amber",
  QUALIFICADO: "teal",
  AGUARDANDO_CLOSER: "amber",
  DISTRIBUIDO_CLOSER: "amber",
  EM_CONTATO: "amber",
  COTACAO: "amber",
  NEGOCIACAO: "amber",
  VENDA: "teal",
  PERDIDO: "red",
  SEM_CONTATO: "red",
  NUMERO_INVALIDO: "red",
  SEM_INTERESSE: "red",
  DUPLICADO: "red",
  FORA_PERFIL: "red",
  RETORNO_AGENDADO: "neutral",
};

export const TEMPERATURA_LABEL: Record<Temperatura, string> = {
  FRIO: "Frio",
  MORNO: "Morno",
  QUENTE: "Quente",
};

export const TEMPERATURA_EMOJI: Record<Temperatura, string> = {
  FRIO: "🔵",
  MORNO: "🟡",
  QUENTE: "🔴",
};

export const TEMPERATURA_TONE: Record<Temperatura, "teal" | "amber" | "red" | "neutral"> = {
  FRIO: "neutral",
  MORNO: "amber",
  QUENTE: "red",
};

// Motivos de descarte oferecidos ao SDR — mapeiam pra status finais "negativos".
export const MOTIVOS_DESCARTE: { value: CrmLeadStatus; label: string }[] = [
  { value: "SEM_CONTATO", label: "Sem contato" },
  { value: "NUMERO_INVALIDO", label: "Número inválido" },
  { value: "SEM_INTERESSE", label: "Cliente sem interesse" },
  { value: "DUPLICADO", label: "Lead duplicado" },
  { value: "FORA_PERFIL", label: "Fora do perfil" },
];
