import { execFile } from "node:child_process";
import { mkdir, stat } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export const BACKUP_BANCO_STATUS = {
  CONCLUIDO: "Concluido",
  FALHOU: "Falhou",
};

function serializarBackup(backup) {
  return {
    ...backup,
    tamanhoBytes: backup.tamanhoBytes === null || backup.tamanhoBytes === undefined
      ? null
      : Number(backup.tamanhoBytes),
  };
}

function nomeArquivoBackup(databaseName, data = new Date()) {
  const timestamp = data.toISOString().replace(/[:.]/g, "-");
  const nomeSeguro = databaseName.replace(/[^a-zA-Z0-9_-]/g, "_");
  return `${nomeSeguro}-${timestamp}.sql`;
}

function mensagemErroBackup(error) {
  const partes = [error.message, error.stderr, error.stdout].filter(Boolean);
  return partes.join("\n").slice(0, 4000);
}

function lerConfiguracaoBanco() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL não configurada.");
  }

  const url = new URL(process.env.DATABASE_URL);
  const databaseName = decodeURIComponent(url.pathname.replace(/^\//, ""));

  if (!databaseName) {
    throw new Error("Nome do banco não encontrado na DATABASE_URL.");
  }

  return {
    host: url.hostname || "localhost",
    port: url.port || "3306",
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    databaseName,
  };
}

async function registrarBackup(prisma, dados) {
  await prisma.$executeRaw`
    INSERT INTO BackupBanco (
      status,
      nomeArquivo,
      caminho,
      tamanhoBytes,
      solicitadoPor,
      solicitadoEm,
      concluidoEm,
      mensagemErro
    ) VALUES (
      ${dados.status},
      ${dados.nomeArquivo ?? null},
      ${dados.caminho ?? null},
      ${dados.tamanhoBytes ?? null},
      ${dados.solicitadoPor ?? null},
      ${dados.solicitadoEm},
      ${dados.concluidoEm ?? null},
      ${dados.mensagemErro ?? null}
    )
  `;

  const [backup] = await prisma.$queryRaw`
    SELECT id, status, nomeArquivo, caminho, tamanhoBytes, solicitadoPor, solicitadoEm, concluidoEm, mensagemErro
    FROM BackupBanco
    WHERE id = LAST_INSERT_ID()
  `;

  return serializarBackup(backup);
}

export async function listarBackupsBanco(prisma) {
  const backups = await prisma.$queryRaw`
    SELECT id, status, nomeArquivo, caminho, tamanhoBytes, solicitadoPor, solicitadoEm, concluidoEm, mensagemErro
    FROM BackupBanco
    ORDER BY solicitadoEm DESC
  `;

  return backups.map(serializarBackup);
}

export async function criarBackupBanco(prisma, { solicitadoPor } = {}) {
  const solicitadoEm = new Date();
  let nomeArquivo = null;
  let caminho = null;

  try {
    const config = lerConfiguracaoBanco();
    const pastaBackups = path.join(process.cwd(), "backups");
    await mkdir(pastaBackups, { recursive: true });

    nomeArquivo = nomeArquivoBackup(config.databaseName, solicitadoEm);
    caminho = path.join(pastaBackups, nomeArquivo);

    const args = [
      "--protocol", "TCP",
      "--host", config.host,
      "--port", config.port,
      "--user", config.user,
      "--single-transaction",
      "--quick",
      "--routines",
      "--triggers",
      "--events",
      "--default-character-set=utf8mb4",
      "--result-file", caminho,
      config.databaseName,
    ];

    await execFileAsync("mysqldump", args, {
      env: {
        ...process.env,
        MYSQL_PWD: config.password,
      },
      maxBuffer: 1024 * 1024 * 20,
    });

    const arquivo = await stat(caminho);

    return registrarBackup(prisma, {
      status: BACKUP_BANCO_STATUS.CONCLUIDO,
      nomeArquivo,
      caminho,
      tamanhoBytes: arquivo.size,
      solicitadoPor: solicitadoPor || "Admin Master",
      solicitadoEm,
      concluidoEm: new Date(),
    });
  } catch (error) {
    return registrarBackup(prisma, {
      status: BACKUP_BANCO_STATUS.FALHOU,
      nomeArquivo,
      caminho,
      solicitadoPor: solicitadoPor || "Admin Master",
      solicitadoEm,
      concluidoEm: new Date(),
      mensagemErro: mensagemErroBackup(error),
    });
  }
}
