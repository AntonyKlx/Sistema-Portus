"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Database, RefreshCw } from "lucide-react";
import {
  Badge,
  Button,
  PageHeader,
  PageWrapper,
  StatCard,
  Table,
} from "@/components/ui";

const usuarioMock = { name: "Usuario Teste", role: "Admin Master" };

function formatarData(data) {
  if (!data) return "-";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(data));
}

function formatarTamanho(bytes) {
  if (!bytes) return "-";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function Mensagem({ tipo, children }) {
  if (!children) return null;
  const classes = tipo === "erro"
    ? "border-red-200 bg-red-50 text-red-700"
    : "border-green-200 bg-green-50 text-green-700";

  return <div className={`rounded-[8px] border px-4 py-3 text-sm font-medium ${classes}`}>{children}</div>;
}

export default function BackupsPage() {
  const [backups, setBackups] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [gerando, setGerando] = useState(false);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");

  async function carregarBackups() {
    setCarregando(true);
    setErro("");

    try {
      const response = await fetch("/api/backups");
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Erro ao buscar backups");
      setBackups(data);
    } catch (error) {
      setErro(error.message);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    let ativo = true;

    fetch("/api/backups")
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Erro ao buscar backups");
        if (ativo) setBackups(data);
      })
      .catch((error) => {
        if (ativo) setErro(error.message);
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });

    return () => {
      ativo = false;
    };
  }, []);

  async function gerarBackup() {
    const confirmou = window.confirm("Deseja gerar um backup completo do banco de dados agora?");
    if (!confirmou) return;

    setGerando(true);
    setErro("");
    setMensagem("");

    try {
      const response = await fetch("/api/backups", { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.mensagemErro || data.error || "Erro ao gerar backup");

      setMensagem("Backup gerado com sucesso.");
      await carregarBackups();
    } catch (error) {
      setErro(error.message);
      await carregarBackups();
    } finally {
      setGerando(false);
    }
  }

  const ultimoBackup = backups[0];
  const totalConcluidos = useMemo(
    () => backups.filter((backup) => backup.status === "Concluido").length,
    [backups],
  );
  const totalFalhas = useMemo(
    () => backups.filter((backup) => backup.status === "Falhou").length,
    [backups],
  );

  return (
    <PageWrapper>
      <PageHeader title="Backups" user={usuarioMock} />

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard label="Backups Realizados" value={backups.length} />
        <StatCard label="Concluidos" value={totalConcluidos} />
        <StatCard label="Falhas" value={totalFalhas} />
      </section>

      {erro && <Mensagem tipo="erro">{erro}</Mensagem>}
      {mensagem && <Mensagem tipo="sucesso">{mensagem}</Mensagem>}

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[360px_1fr]">
        <article className="table-wrapper h-fit p-5">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-[8px] bg-[#F3E8FF] text-[#582688]">
              <Database size={22} />
            </div>
            <div>
              <h2 className="section-title">Backup do Banco</h2>
              <p className="text-sm text-gray-500">Gere uma copia completa do MySQL.</p>
            </div>
          </div>

          <div className="mb-5 rounded-[8px] border border-[#E5E7EB] p-4">
            <p className="text-xs font-medium uppercase text-gray-400">Ultimo backup</p>
            <p className="mt-1 text-sm font-semibold text-gray-800">{formatarData(ultimoBackup?.solicitadoEm)}</p>
            <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
              {ultimoBackup?.status === "Falhou" ? <AlertTriangle size={16} className="text-red-600" /> : <CheckCircle2 size={16} className="text-green-600" />}
              {ultimoBackup?.status || "Nenhum backup registrado"}
            </div>
          </div>

          <Button onClick={gerarBackup} disabled={gerando} className="w-full justify-center">
            <RefreshCw size={17} className={gerando ? "animate-spin" : ""} />
            {gerando ? "Gerando backup..." : "Gerar Backup"}
          </Button>
        </article>

        <Table title="Historico de Backups" columns={["Data/Hora", "Status", "Arquivo", "Tamanho", "Solicitado por"]}>
          {carregando ? (
            <tr className="table-row"><td className="table-cell" colSpan={5}>Carregando historico...</td></tr>
          ) : backups.length === 0 ? (
            <tr className="table-row"><td className="table-cell" colSpan={5}>Nenhum backup realizado.</td></tr>
          ) : backups.map((backup) => (
            <tr key={backup.id} className="table-row">
              <td className="table-cell font-medium">{formatarData(backup.solicitadoEm)}</td>
              <td className="table-cell">
                <Badge label={backup.status} variant={backup.status === "Concluido" ? "green" : "red"} />
              </td>
              <td className="table-cell">
                <div className="max-w-[240px] truncate" title={backup.mensagemErro || backup.nomeArquivo || "-"}>
                  {backup.status === "Falhou" ? backup.mensagemErro : backup.nomeArquivo || "-"}
                </div>
              </td>
              <td className="table-cell">{formatarTamanho(backup.tamanhoBytes)}</td>
              <td className="table-cell">{backup.solicitadoPor || "-"}</td>
            </tr>
          ))}
        </Table>
      </section>
    </PageWrapper>
  );
}
