"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { Trash2 } from "lucide-react";
import {
  Badge,
  IconButton,
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
  const { data: session } = useSession();
  const ehMorador = session?.user?.perfil === "morador";

  const [areas, setAreas] = useState([]);
  const [areaSelecionadaId, setAreaSelecionadaId] = useState("");

  const [reservasMorador, setReservasMorador] = useState([]);
  const [reservasAdmin, setReservasAdmin] = useState([]);
  const [minhasReservas, setMinhasReservas] = useState([]);

  const [carregandoAreas, setCarregandoAreas] = useState(true);
  const [carregandoMorador, setCarregandoMorador] = useState(false);
  const [carregandoAdmin, setCarregandoAdmin] = useState(true);
  const [carregandoMinhas, setCarregandoMinhas] = useState(false);

  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  // Carrega as Áreas Comuns e Reservas Pendentes (Admin) ao montar a página
  useEffect(() => {
    buscarAreas();
    buscarReservasAdmin();
  }, []);

  // RF11 — Carrega as reservas do próprio morador logado
  useEffect(() => {
    if (ehMorador) buscarMinhasReservas();
  }, [ehMorador]);

  // Sempre que a área selecionada mudar, busca as reservas aprovadas (Calendário)
  useEffect(() => {
    if (areaSelecionadaId) {
      buscarReservasMorador(areaSelecionadaId);
    }
  }, [areaSelecionadaId]);

  const buscarAreas = async () => {
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
  };

  const buscarReservasAdmin = async () => {
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
  };

  const buscarReservasMorador = async (idArea) => {
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
  };

  // RF11 — busca apenas as reservas do morador autenticado
  const buscarMinhasReservas = async () => {
    setCarregandoMinhas(true);
    try {
      const res = await fetch("/api/reservas?minhas=true");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao buscar suas reservas");
      setMinhasReservas(data);
    } catch (err) {
      setErro(err.message);
    } finally {
      setCarregandoMinhas(false);
    }
  };

  // RF11 — cancela uma reserva própria, respeitando a antecedência mínima
  const cancelarReserva = async (id) => {
    const confirmou = window.confirm("Deseja realmente cancelar esta reserva?");
    if (!confirmou) return;

    setErro("");
    setSucesso("");
    try {
      const res = await fetch(`/api/reservas/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao cancelar reserva");

      setSucesso("Reserva cancelada com sucesso.");
      buscarMinhasReservas();
      if (areaSelecionadaId) buscarReservasMorador(areaSelecionadaId);
    } catch (err) {
      setErro(err.message);
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

      {/* SESSÃO 1.5: MINHAS RESERVAS (Morador) — RF11 */}
      {ehMorador && (
        <section className="flex flex-col gap-4">
          <div>
            <h2 className="section-title">Minhas reservas</h2>
            <p className="mt-1 text-sm text-gray-500">
              Cancele uma reserva pendente ou aprovada respeitando a antecedência mínima da área.
            </p>
          </div>

          <Table columns={["Área Comum", "Data/Hora", "Status", "Ações"]}>
            {carregandoMinhas ? (
              <tr className="table-row"><td className="table-cell" colSpan={4}>Carregando...</td></tr>
            ) : minhasReservas.length === 0 ? (
              <tr className="table-row"><td className="table-cell" colSpan={4}>Você ainda não fez nenhuma reserva.</td></tr>
            ) : (
              minhasReservas.map((reserva) => {
                const cancelavel = ["Pendente", "Aprovada"].includes(reserva.status);
                return (
                  <tr key={reserva.id} className="table-row">
                    <td className="table-cell font-medium">{reserva.areaComum?.nome}</td>
                    <td className="table-cell">{formatarData(reserva.dataHora)}</td>
                    <td className="table-cell">
                      <Badge label={reserva.status} variant={varianteStatus(reserva.status)} />
                    </td>
                    <td className="table-cell">
                      {cancelavel && (
                        <IconButton
                          icon={Trash2}
                          title="Cancelar reserva"
                          onClick={() => cancelarReserva(reserva.id)}
                        />
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </Table>
        </section>
      )}

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
    </PageWrapper>
  );
}