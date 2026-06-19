import assert from "node:assert/strict";
import test from "node:test";
import {
  criarBackupReservas,
  listarBackupsReservas,
  montarSnapshotReservas,
} from "../../lib/reservaBackup.mjs";

test("POST /api/reservas/backups cria snapshot com reservas e data/hora", async () => {
  const reservaData = new Date("2026-06-19T14:00:00.000Z");
  const criadoEm = new Date("2026-06-18T10:00:00.000Z");
  const chamadas = [];

  const prismaMock = {
    reserva: {
      findMany: async (args) => {
        chamadas.push(["reserva.findMany", args]);
        return [
          {
            id: 1,
            dataHora: reservaData,
            status: "Aprovada",
            justificativa: null,
            criadoEm,
            morador: {
              id: 7,
              usuario: { nome: "Maria", email: "maria@email.com" },
              unidade: { bloco: "A", andar: 2, numero: "204" },
            },
            areaComum: { id: 3, nome: "Churrasqueira", descricao: "Area externa" },
          },
        ];
      },
    },
    backupReserva: {
      create: async (args) => {
        chamadas.push(["backupReserva.create", args]);
        return { id: 10, ...args.data, mensagemErro: null };
      },
    },
  };

  const backup = await criarBackupReservas(prismaMock, { solicitadoPor: "Pessoa B" });

  assert.equal(backup.status, "Concluido");
  assert.equal(backup.totalReservas, 1);
  assert.equal(backup.solicitadoPor, "Pessoa B");
  assert.ok(backup.solicitadoEm instanceof Date);
  assert.ok(backup.concluidoEm instanceof Date);
  assert.equal(backup.conteudo.reservas[0].areaComum.nome, "Churrasqueira");
  assert.equal(chamadas[0][0], "reserva.findMany");
  assert.equal(chamadas[1][0], "backupReserva.create");
});

test("GET /api/reservas/backups lista backups mais recentes primeiro", async () => {
  const prismaMock = {
    backupReserva: {
      findMany: async (args) => {
        assert.deepEqual(args.orderBy, { solicitadoEm: "desc" });
        return [{ id: 2, status: "Concluido", totalReservas: 4 }];
      },
    },
  };

  const backups = await listarBackupsReservas(prismaMock);

  assert.deepEqual(backups, [{ id: 2, status: "Concluido", totalReservas: 4 }]);
});

test("montarSnapshotReservas serializa datas para JSON", () => {
  const snapshot = montarSnapshotReservas(
    [
      {
        id: 5,
        dataHora: new Date("2026-06-20T12:00:00.000Z"),
        status: "Pendente",
        justificativa: "",
        criadoEm: new Date("2026-06-19T12:00:00.000Z"),
      },
    ],
    new Date("2026-06-19T13:00:00.000Z"),
  );

  assert.equal(snapshot.geradoEm, "2026-06-19T13:00:00.000Z");
  assert.equal(snapshot.reservas[0].dataHora, "2026-06-20T12:00:00.000Z");
});
