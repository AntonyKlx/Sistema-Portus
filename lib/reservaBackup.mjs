export const BACKUP_RESERVA_STATUS = {
  CONCLUIDO: "Concluido",
  FALHOU: "Falhou",
};

const reservaSelect = {
  id: true,
  dataHora: true,
  status: true,
  justificativa: true,
  criadoEm: true,
  morador: {
    select: {
      id: true,
      usuario: {
        select: {
          nome: true,
          email: true,
        },
      },
      unidade: {
        select: {
          bloco: true,
          andar: true,
          numero: true,
        },
      },
    },
  },
  areaComum: {
    select: {
      id: true,
      nome: true,
      descricao: true,
    },
  },
};

function serializarData(valor) {
  if (!valor) return null;
  return valor instanceof Date ? valor.toISOString() : valor;
}

export function montarSnapshotReservas(reservas, geradoEm = new Date()) {
  return {
    tipo: "reservas",
    versao: 1,
    geradoEm: serializarData(geradoEm),
    totalReservas: reservas.length,
    reservas: reservas.map((reserva) => ({
      id: reserva.id,
      dataHora: serializarData(reserva.dataHora),
      status: reserva.status,
      justificativa: reserva.justificativa,
      criadoEm: serializarData(reserva.criadoEm),
      morador: {
        id: reserva.morador?.id ?? null,
        nome: reserva.morador?.usuario?.nome ?? null,
        email: reserva.morador?.usuario?.email ?? null,
        unidade: reserva.morador?.unidade
          ? {
              bloco: reserva.morador.unidade.bloco,
              andar: reserva.morador.unidade.andar,
              numero: reserva.morador.unidade.numero,
            }
          : null,
      },
      areaComum: {
        id: reserva.areaComum?.id ?? null,
        nome: reserva.areaComum?.nome ?? null,
        descricao: reserva.areaComum?.descricao ?? null,
      },
    })),
  };
}

export async function listarBackupsReservas(prisma) {
  return prisma.backupReserva.findMany({
    orderBy: {
      solicitadoEm: "desc",
    },
    select: {
      id: true,
      status: true,
      totalReservas: true,
      solicitadoPor: true,
      solicitadoEm: true,
      concluidoEm: true,
      mensagemErro: true,
    },
  });
}

export async function criarBackupReservas(prisma, { solicitadoPor } = {}) {
  const solicitadoEm = new Date();
  const reservas = await prisma.reserva.findMany({
    orderBy: {
      dataHora: "asc",
    },
    select: reservaSelect,
  });

  const conteudo = montarSnapshotReservas(reservas, solicitadoEm);

  return prisma.backupReserva.create({
    data: {
      status: BACKUP_RESERVA_STATUS.CONCLUIDO,
      totalReservas: reservas.length,
      solicitadoPor: solicitadoPor || "Admin Master",
      solicitadoEm,
      concluidoEm: new Date(),
      conteudo,
    },
    select: {
      id: true,
      status: true,
      totalReservas: true,
      solicitadoPor: true,
      solicitadoEm: true,
      concluidoEm: true,
      mensagemErro: true,
    },
  });
}
