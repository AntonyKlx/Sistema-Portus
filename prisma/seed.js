require("dotenv").config();

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function resetSeedData(prisma) {
  await prisma.logAcesso.deleteMany();
  await prisma.reserva.deleteMany();
  await prisma.regrasReserva.deleteMany();
  await prisma.areaComum.deleteMany();
  await prisma.porteiro.deleteMany();
  await prisma.morador.deleteMany();
  await prisma.usuario.deleteMany();
  await prisma.permissao.deleteMany();
  await prisma.perfilAcesso.deleteMany();
  await prisma.encomenda.deleteMany();
  await prisma.unidade.deleteMany();
}

async function createPerfis(prisma) {
  const perfis = [
    {
      nome: "morador",
      permissoes: ["ver_encomendas", "fazer_reserva", "cancelar_reserva"],
    },
    {
      nome: "porteiro",
      permissoes: ["registrar_encomenda", "baixar_encomenda", "consultar_unidades"],
    },
    {
      nome: "sindico",
      permissoes: ["aprovar_reserva", "cadastrar_morador", "gerenciar_areas_comuns"],
    },
    {
      nome: "administrador",
      permissoes: ["gerenciar_usuarios", "gerenciar_perfis", "visualizar_relatorios"],
    },
    {
      nome: "adminMaster",
      permissoes: ["acesso_total", "gerenciar_administradores", "configurar_sistema"],
    },
  ];

  const criados = {};

  for (const perfil of perfis) {
    criados[perfil.nome] = await prisma.perfilAcesso.create({
      data: {
        nome: perfil.nome,
        permissoes: {
          create: perfil.permissoes.map((nome) => ({ nome })),
        },
      },
    });
  }

  return criados;
}

async function main() {
  try {
    await resetSeedData(prisma);

    const perfis = await createPerfis(prisma);

    const unidade101 = await prisma.unidade.create({
      data: { bloco: "A", andar: 1, numero: "101" },
    });

    const unidade102 = await prisma.unidade.create({
      data: { bloco: "A", andar: 1, numero: "102" },
    });

    await prisma.unidade.create({
      data: { bloco: "B", andar: 2, numero: "201" },
    });

    await prisma.usuario.create({
      data: {
        nome: "Joao Silva",
        email: "joao.silva@email.com",
        senha: "123456",
        ativo: true,
        tentativasIncorretas: 0,
        perfilId: perfis.morador.id,
        morador: {
          create: {
            telefone: "32999990001",
            inadimplente: false,
            unidadeId: unidade101.id,
          },
        },
      },
    });

    await prisma.usuario.create({
      data: {
        nome: "Maria Souza",
        email: "maria.souza@email.com",
        senha: "123456",
        ativo: true,
        tentativasIncorretas: 0,
        perfilId: perfis.morador.id,
        morador: {
          create: {
            telefone: "32999990002",
            inadimplente: false,
            unidadeId: unidade102.id,
          },
        },
      },
    });

    await prisma.usuario.create({
      data: {
        nome: "Carlos Porteiro",
        email: "carlos.porteiro@email.com",
        senha: "123456",
        ativo: true,
        tentativasIncorretas: 0,
        perfilId: perfis.porteiro.id,
        porteiro: { create: {} },
      },
    });

    await prisma.usuario.create({
      data: {
        nome: "Ana Sindica",
        email: "ana.sindica@email.com",
        senha: "123456",
        ativo: true,
        tentativasIncorretas: 0,
        perfilId: perfis.sindico.id,
      },
    });

    await prisma.areaComum.create({
      data: {
        nome: "Salao de Festas",
        descricao: "Espaco para eventos e confraternizacoes.",
        regras: {
          create: {
            antecedenciaMinimaReserva: 24,
            antecedenciaMinCancelamento: 12,
            limiteReservasAtivas: 2,
            horarioPermitidoInicio: new Date("2000-01-01T08:00:00.000"),
            horarioPermitidoFim: new Date("2000-01-01T22:00:00.000"),
          },
        },
      },
    });

    console.log("Seed concluido com sucesso.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("Erro ao executar seed:");
  console.error(error);
  process.exit(1);
});
