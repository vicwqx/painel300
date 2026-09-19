# Painel 300 — Equipe 300 / Loma Proteção Veicular

Migração do painel HTML + Google Sheets/Apps Script para uma aplicação web real:
**Next.js + TypeScript + Tailwind + Prisma + PostgreSQL + NextAuth.js**.

Este é o **MVP** da migração: autenticação real, lançamento diário, ranking e
meta do mês, ponta a ponta. Os módulos avançados que já existiam no painel
antigo (simulador de cenários, radar de risco, mapa de estrelados, campanhas,
controle de leads, comissão detalhada, gráficos por métrica) entram nas
próximas etapas, sobre essa mesma base — a estrutura de banco já foi desenhada
pra comportar todos eles (veja `prisma/schema.prisma`).

## O que já funciona

- Login real (e-mail + senha, sessão via NextAuth.js)
- 3 papéis: `ADMIN`, `GESTOR`, `EXECUTIVO` — cada um só acessa o que pode
- Lançamento diário (8 métricas, igual ao painel atual) — upsert por dia
- Visão geral: KPIs do mês, meta com projeção, ranking da equipe
- Banco relacional de verdade (Postgres via Prisma), com IDs e relacionamentos
- Regra de comissão e regra de meta centralizadas em `src/lib/calculos/` —
  uma fonte de verdade só, em vez de duplicada entre frontend e Apps Script

## Pré-requisitos

- Node.js 18 ou mais recente
- PostgreSQL rodando (local ou remoto) com um banco vazio criado
- npm

## Como rodar localmente

```bash
# 1. Instale as dependências
npm install

# 2. Copie o arquivo de ambiente e edite com seus dados
cp .env.example .env
# abra o .env e ajuste DATABASE_URL pro seu Postgres, e gere um AUTH_SECRET:
#   openssl rand -base64 32

# 3. Gere o client do Prisma
npx prisma generate

# 4. Crie as tabelas no seu banco (primeira vez)
npx prisma migrate dev --name init

# 5. Popule o banco com dados iniciais (config de comissão, meta do mês, admin)
npm run db:seed

# 6. Rode em desenvolvimento
npm run dev
```

Acesse `http://localhost:3000`. Login inicial criado pelo seed:

```
E-mail: admin@loma.com.br
Senha:  troque-esta-senha
```

**Troque essa senha assim que entrar** (a troca pela interface entra numa
próxima etapa — por ora, gere um novo hash com bcrypt e atualize direto no
banco, ou recrie o usuário pelo Prisma Studio: `npx prisma studio`).

## Cadastrando executivos

Por enquanto (antes da tela de administração completa), cadastre pelo
Prisma Studio (`npx prisma studio`) ou direto via script: crie um `User`
(com `passwordHash` gerado por bcrypt) e o `Profile` vinculado (nome, cargo).
Isso vira formulário na tela de Admin na próxima etapa.

## Migrando os dados do Google Sheets

Ainda não incluído neste pacote — é a próxima etapa combinada. Vai ser um
script Node separado que lê o Sheets (export CSV ou API), valida cada linha
(nomes duplicados, datas malformadas, números ausentes viram 0) e insere no
Postgres respeitando os relacionamentos (perfil primeiro, depois lançamentos
e leads referenciando o `profileId`).

## Deploy na Vercel

1. Suba este projeto num repositório Git (GitHub, por exemplo).
2. Na Vercel, importe o repositório.
3. Em **Settings → Environment Variables**, configure:
   - `DATABASE_URL` — string de conexão do seu Postgres de produção (pode ser
     Neon, Supabase só-banco, Railway, RDS, ou o Postgres que você já tem,
     desde que acessível pela internet)
   - `AUTH_SECRET` — mesmo valor gerado localmente, ou um novo
   - `NEXTAUTH_URL` — a URL que a Vercel vai te dar (ex: `https://painel300.vercel.app`)
4. Rode as migrations contra o banco de produção **antes** do primeiro deploy
   (ou como parte do build): `npx prisma migrate deploy`.
5. Deploy.

Nunca commite o `.env` — ele já está no `.gitignore` padrão do Next.js.

## Estrutura do projeto

```
prisma/schema.prisma       modelo de dados completo (já cobre os módulos futuros)
prisma/seed.ts             popula config de comissão, meta do mês, admin inicial
src/lib/auth.ts            configuração do NextAuth (credentials + JWT)
src/lib/calculos/          regra de negócio centralizada (comissão, metas, streaks)
src/lib/prisma.ts          client do Prisma (singleton)
src/middleware.ts          proteção de rota por papel (ADMIN/GESTOR/EXECUTIVO)
src/app/login/             tela de login
src/app/dashboard/         área logada (layout com sidebar por papel)
src/app/dashboard/lancamento/   formulário de lançamento diário
src/app/dashboard/gestor/       painel do gestor (placeholder — próxima etapa)
src/app/dashboard/admin/        administração (placeholder — próxima etapa)
src/components/ui/         design system base (Button, Card, Input, Badge)
```

## Por que Postgres puro em vez de Supabase

O plano original considerava Supabase (Auth + RLS + Realtime prontos). Como
você já tem Postgres disponível, trocamos Supabase Auth por NextAuth.js
(credentials + bcrypt + JWT) rodando direto sobre esse banco — mesmo
resultado (login real, sessão, permissão por papel), sem depender de um
serviço externo. A troca de RLS automático é a checagem de papel no
`middleware.ts` e nas Server Actions; o Realtime automático do Supabase vira,
mais pra frente, polling eficiente ou `LISTEN/NOTIFY` do próprio Postgres.

## Próximas etapas (nesta ordem sugerida)

1. Script de migração dos dados reais do Google Sheets
2. Cadastro de cargo/campanha pela interface de Admin
3. Painel do gestor completo: funil, simulador de cenários, radar de risco,
   mapa de estrelados, campanhas, controle de leads (com histórico de status)
4. Calculadora de comissão individual + página de perfil por vendedor
   (`/dashboard/vendedor/[id]`)
5. Gráficos (Recharts): tendência de cada métrica, heatmap mensal
6. Elementos 3D pontuais no pódio do ranking (React Three Fiber)
7. Realtime (Postgres LISTEN/NOTIFY ou polling eficiente) pro ranking
   atualizar sozinho
8. E-mails automáticos (resumo diário, perseguição ao vivo, coaching semanal)
   — reaproveitando a mesma lógica de `src/lib/calculos/`, agora chamada de
   um cron job (Vercel Cron, por exemplo) em vez do Apps Script
