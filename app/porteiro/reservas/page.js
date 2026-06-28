"use client";

import { useEffect, useMemo, useState } from "react";
import { DatabaseBackup, RefreshCw } from "lucide-react";
import {
  Badge,
  Button,
  PageHeader,
  PageWrapper,
  Select,
  StatCard,
  Table,
} from "@/components/ui";

const usuarioMock = { name: "Pessoa B", role: "Administrador" };

function formatarData(data) {
  if (!data) return "-";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(data));
}

function varianteStatus(status) {
  if (status === "Pendente") return "orange";
  if (status === "Aprovada") return "green";
  if (status === "Reprovada") return "red";
  if (status === "Concluido") return "green";
  if (status === "Falhou") return "red";
  return "blue";
}

function Mensagem({ tipo, children }) {
  if (!children) return null;
  const classes =
    tipo === "erro"
      ? "border-red-200 bg-red-50 text-red-700"
      : "border-green-200 bg-green-50 text-green-700";
  return (
    <div className={`rounded-[8px] border px-4 py-3 text-sm font-medium ${classes}`}>
      {children}
    </div>
  );
}

export default function ReservasPage() {
  const [areas, setAreas] = useState([]);
  const [areaSelecionadaId, setAreaSelecionadaId] = useState("");

  const [reservasMorador, setReservasMorador] = useState([]);
  const [reservasAdmin, setReservasAdmin] = useState([]);
  const [backups, setBackups] = useState([]);

  const [carregandoAreas, setCarregandoAreas] = useState(true);
  const [carregandoMorador, setCarregandoMorador] = useState(false);
  const [carregandoAdmin, setCarregandoAdmin] = useState(true);
  const [carregandoBackups, setCarregandoBackups] = useState(true);
  const [gerandoBackup, setGerandoBackup] = useState(false);

  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  // Carrega as Áreas Comuns e Reservas Pendentes (Admin) ao montar a página
  useEffect(() => {
    buscarAreas();
    buscarReservasAdmin();
    buscarBackups();
  }, []);

  // Sempre que a área selecionada mudar, busca as reservas aprovadas (Calendário)
  useEffect(() => {
    if (areaSelecionadaId) {
      buscarReservasMorador(areaSelecionadaId);
    }
  }, [areaSelecionadaId]);

  async function buscarAreas() {
    try {
      const res = await fetch("/api/areas-comuns");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao buscar áreas");
      setAreas(data);
      if (data.length > 0) setAreaSelecionadaId(String(data[0].id));
    } catch (err) {
      setErro(err.message);
    } finally {
      setCarregandoAreas(false);
    }
  }

  async function buscarReservasAdmin() {
    setCarregandoAdmin(true);
    try {
      const res = await fetch("/api/reservas?status=Pendente");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao buscar reservas pendentes");
      setReservasAdmin(data);
    } catch (err) {
      setErro(err.message);
    } finally {
      setCarregandoAdmin(false);
    }
  }

  async function buscarReservasMorador(idArea) {
    setCarregandoMorador(true);
    try {
      const res = await fetch(`/api/reservas?areaComumId=${idArea}&status=Aprovada`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao buscar reservas da área");
      setReservasMorador(data);
    } catch (err) {
      setErro(err.message);
    } finally {
      setCarregandoMorador(false);
    }
  }

  async function buscarBackups() {
    setCarregandoBackups(true);
    try {
      const res = await fetch("/api/reservas/backups");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao buscar backups");
      setBackups(data);
    } catch (err) {
      setErro(err.message);
    } finally {
      setCarregandoBackups(false);
    }
  }

  const solicitarBackup = async () => {
    setErro("");
    setSucesso("");
    setGerandoBackup(true);
    try {
      const res = await fetch("/api/reservas/backups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ solicitadoPor: usuarioMock.name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao gerar backup");

      setSucesso(`Backup de reservas #${data.id} concluído com ${data.totalReservas} registro(s).`);
      await buscarBackups();
    } catch (err) {
      setErro(err.message);
    } finally {
      setGerandoBackup(false);
    }
  };

  const avaliarReserva = async (id, novoStatus) => {
    setErro("");
    setSucesso("");
    try {
      const res = await fetch(`/api/reservas/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: novoStatus, justificativa: "" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao atualizar reserva");

      setSucesso(`Reserva ${novoStatus.toLowerCase()} com sucesso! Email enviado.`);

      // Recarrega as listas para refletir a mudança
      buscarReservasAdmin();
      if (areaSelecionadaId) buscarReservasMorador(areaSelecionadaId);
    } catch (err) {
      setErro(err.message);
    }
  };

  const opcoesAreas = useMemo(() => {
    const opcoes = areas.map((area) => ({
      value: String(area.id),
      label: area.nome,
    }));
    return carregandoAreas
      ? [{ value: "", label: "Carregando áreas..." }]
      : opcoes.length > 0
        ? opcoes
        : [{ value: "", label: "Nenhuma área cadastrada" }];
  }, [carregandoAreas, areas]);

  return (
    <PageWrapper>
      <PageHeader title="Reservas" user={usuarioMock} />

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <StatCard label="Pendentes de Aprovação" value={reservasAdmin.length} />
        <StatCard label="Reservas Aprovadas na Área" value={reservasMorador.length} />
      </section>

      {erro && <Mensagem tipo="erro">{erro}</Mensagem>}
      {sucesso && <Mensagem tipo="sucesso">{sucesso}</Mensagem>}

      {/* SESSÃO 1: TELA DO SÍNDICO/ADMIN */}
      <section className="flex flex-col gap-4">
        <div>
          <h2 className="section-title">Gestão de Reservas (Síndico)</h2>
          <p className="mt-1 text-sm text-gray-500">Aprove ou reprove solicitações pendentes.</p>
        </div>

        <Table columns={["Área Comum", "Morador", "Data/Hora", "Status", "Ações"]}>
          {carregandoAdmin ? (
            <tr className="table-row"><td className="table-cell" colSpan={5}>Carregando...</td></tr>
          ) : reservasAdmin.length === 0 ? (
            <tr className="table-row"><td className="table-cell" colSpan={5}>Nenhuma solicitação pendente.</td></tr>
          ) : (
            reservasAdmin.map((reserva) => (
              <tr key={reserva.id} className="table-row">
                <td className="table-cell font-medium">{reserva.areaComum?.nome}</td>
                <td className="table-cell">{reserva.morador?.usuario?.nome}</td>
                <td className="table-cell">{formatarData(reserva.dataHora)}</td>
                <td className="table-cell">
                  <Badge label={reserva.status} variant={varianteStatus(reserva.status)} />
                </td>
                <td className="table-cell">
                  <div className="flex items-center gap-3">
                    <button onClick={() => avaliarReserva(reserva.id, "Aprovada")} className="text-sm font-semibold text-green-600 hover:text-green-800 transition-colors">Aprovar</button>
                    <button onClick={() => avaliarReserva(reserva.id, "Reprovada")} className="text-sm font-semibold text-red-600 hover:text-red-800 transition-colors">Reprovar</button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </Table>
      </section>

      {/* SESSÃO 2: TELA DO MORADOR (Calendário/Lista) */}
      <section className="flex flex-col gap-4 mt-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="section-title">Calendário de Ocupação (Morador)</h2>
            <p className="mt-1 text-sm text-gray-500">Veja as datas confirmadas para o espaço.</p>
          </div>
          <div className="w-full md:w-[360px]">
            <Select
              label="Área Comum"
              name="areaSelecionadaId"
              value={areaSelecionadaId}
              onChange={(e) => setAreaSelecionadaId(e.target.value)}
              options={opcoesAreas}
            />
          </div>
        </div>

        <Table columns={["Data/Hora", "Status", "Morador"]}>
          {carregandoMorador ? (
            <tr className="table-row"><td className="table-cell" colSpan={3}>Carregando calendário...</td></tr>
          ) : reservasMorador.length === 0 ? (
            <tr className="table-row"><td className="table-cell" colSpan={3}>A área está totalmente livre.</td></tr>
          ) : (
            reservasMorador.map((reserva) => (
              <tr key={reserva.id} className="table-row">
                <td className="table-cell font-medium">{formatarData(reserva.dataHora)}</td>
                <td className="table-cell"><Badge label={reserva.status} variant={varianteStatus(reserva.status)} /></td>
                <td className="table-cell text-gray-500 text-sm">Ocupado por {reserva.morador?.usuario?.nome}</td>
              </tr>
            ))
          )}
        </Table>
      </section>

      {/* SESSÃO 3: BACKUP ADMIN MASTER */}
      <section className="flex flex-col gap-4 mt-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="section-title">Backup de Reservas (Admin Master)</h2>
            <p className="mt-1 text-sm text-gray-500">Solicite e monitore snapshots do módulo de reservas.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="filter" onClick={buscarBackups} disabled={carregandoBackups || gerandoBackup}>
              <RefreshCw size={16} aria-hidden="true" />
              Atualizar
            </Button>
            <Button onClick={solicitarBackup} disabled={gerandoBackup}>
              <DatabaseBackup size={16} aria-hidden="true" />
              {gerandoBackup ? "Gerando..." : "Solicitar backup"}
            </Button>
          </div>
        </div>

        <Table columns={["ID", "Status", "Reservas", "Solicitado por", "Solicitado em", "Concluído em"]}>
          {carregandoBackups ? (
            <tr className="table-row"><td className="table-cell" colSpan={6}>Carregando backups...</td></tr>
          ) : backups.length === 0 ? (
            <tr className="table-row"><td className="table-cell" colSpan={6}>Nenhum backup solicitado.</td></tr>
          ) : (
            backups.map((backup) => (
              <tr key={backup.id} className="table-row">
                <td className="table-cell font-medium">#{backup.id}</td>
                <td className="table-cell">
                  <Badge label={backup.status} variant={varianteStatus(backup.status)} />
                </td>
                <td className="table-cell">{backup.totalReservas}</td>
                <td className="table-cell">{backup.solicitadoPor || "-"}</td>
                <td className="table-cell">{formatarData(backup.solicitadoEm)}</td>
                <td className="table-cell">{formatarData(backup.concluidoEm)}</td>
              </tr>
            ))
          )}
        </Table>
      </section>
    </PageWrapper>
  );
}
