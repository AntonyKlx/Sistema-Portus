require("dotenv").config();

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

function isBcryptHash(senha) {
  return /^\$2[aby]\$\d{2}\$/.test(senha);
}

async function main() {
  const usuarios = await prisma.usuario.findMany({
    select: { id: true, senha: true },
  });

  let atualizados = 0;

  for (const usuario of usuarios) {
    if (isBcryptHash(usuario.senha)) continue;

    await prisma.usuario.update({
      where: { id: usuario.id },
      data: { senha: await bcrypt.hash(usuario.senha, 10) },
    });

    atualizados += 1;
  }

  console.log(`${atualizados} senha(s) convertida(s) para bcrypt.`);
}

main()
  .catch((error) => {
    console.error("Erro ao converter senhas:");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
