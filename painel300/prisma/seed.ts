import { PrismaClient, Cargo, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Config de comissão por cargo — mesma regra que hoje vive hardcoded no HTML.
  // Edite estes valores livremente; é dado, não código.
  await prisma.comissaoConfig.upsert({
    where: { cargo: Cargo.JUNIOR },
    update: {},
    create: { cargo: Cargo.JUNIOR, fixo: 2000, ticketMedio: 100, bonusAtivasLimite: 25, bonusValor: 1000 },
  });
  await prisma.comissaoConfig.upsert({
    where: { cargo: Cargo.SENIOR },
    update: {},
    create: { cargo: Cargo.SENIOR, fixo: 2000, ticketMedio: 100, bonusAtivasLimite: 25, bonusValor: 2000 },
  });
  await prisma.comissaoConfig.upsert({
    where: { cargo: Cargo.MASTER },
    update: {},
    create: { cargo: Cargo.MASTER, fixo: 4000, ticketMedio: 100, bonusAtivasLimite: 45, bonusValor: 5500 },
  });

  // Meta do mês atual
  const inicioDoMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  await prisma.metaMensal.upsert({
    where: { vigencia: inicioDoMes },
    update: {},
    create: { vigencia: inicioDoMes, metaVendas: 300 },
  });

  // Usuário admin inicial — TROQUE a senha depois do primeiro login
  const senhaHash = await bcrypt.hash("troque-esta-senha", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@loma.com.br" },
    update: {},
    create: {
      email: "admin@loma.com.br",
      passwordHash: senhaHash,
      role: Role.ADMIN,
      profile: { create: { nome: "Administrador", cargo: Cargo.MASTER } },
    },
  });

  console.log("Seed concluído.");
  console.log(`Admin: ${admin.email} / senha: troque-esta-senha`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
