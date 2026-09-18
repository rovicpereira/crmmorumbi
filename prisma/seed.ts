import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const ESTAGIOS_PADRAO = [
  { chave: "novo_lead", rotulo: "Novo lead", ordem: 1, cor: "#3b82f6", final: false },
  { chave: "orcamento_enviado", rotulo: "Orçamento enviado", ordem: 2, cor: "#f59e0b", final: false },
  { chave: "negociacao", rotulo: "Negociação", ordem: 3, cor: "#a855f7", final: false },
  { chave: "fechado", rotulo: "Fechado", ordem: 4, cor: "#22c55e", final: true },
  { chave: "perdido", rotulo: "Perdido", ordem: 5, cor: "#ef4444", final: true },
];

const CATEGORIAS_PRODUTO = [
  "Banheiro",
  "Cozinha e Área de Serviço",
  "Elétrica",
  "Ferragens",
  "Ferramentas",
  "Forro",
  "Hidráulica",
  "Impermeabilizantes",
  "Materiais Básicos",
  "Material Elétrico",
  "Obras de Pedra, Gesso, Cimento",
  "Padrão",
  "Pisos e Revestimentos",
  "Plásticos e suas Obras",
  "Portas e Esquadrias",
  "Tintas e Complementos",
  "Uso e Consumo",
  "Utilidades Domésticas",
];

async function main() {
  for (const estagio of ESTAGIOS_PADRAO) {
    await prisma.estagioFunil.upsert({
      where: { chave: estagio.chave },
      update: {},
      create: estagio,
    });
  }

  for (const [indice, nome] of CATEGORIAS_PRODUTO.entries()) {
    await prisma.categoriaProduto.upsert({
      where: { nome },
      update: {},
      create: { nome, ordem: indice + 1 },
    });
  }

  const emailAdmin = process.env.SEED_ADMIN_EMAIL ?? "admin@morumbi.local";
  const senhaAdmin = process.env.SEED_ADMIN_SENHA ?? "trocar-esta-senha";

  const senhaHash = await bcrypt.hash(senhaAdmin, 10);

  await prisma.usuario.upsert({
    where: { email: emailAdmin },
    update: {},
    create: {
      nome: "Administrador",
      email: emailAdmin,
      senhaHash,
      papel: "admin",
    },
  });

  const emailExtra = process.env.SEED_EXTRA_ADMIN_EMAIL;
  const senhaExtra = process.env.SEED_EXTRA_ADMIN_SENHA;
  const nomeExtra = process.env.SEED_EXTRA_ADMIN_NOME ?? "Administrador";

  if (emailExtra && senhaExtra) {
    const senhaExtraHash = await bcrypt.hash(senhaExtra, 10);
    await prisma.usuario.upsert({
      where: { email: emailExtra },
      update: {},
      create: {
        nome: nomeExtra,
        email: emailExtra,
        senhaHash: senhaExtraHash,
        papel: "admin",
      },
    });
    console.log(`Usuario adicional criado: ${emailExtra}`);
  }

  console.log(`Seed concluído. Login inicial: ${emailAdmin} / ${senhaAdmin}`);
  console.log("Troque a senha assim que possível.");
}

main()
  .catch((erro) => {
    console.error(erro);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
