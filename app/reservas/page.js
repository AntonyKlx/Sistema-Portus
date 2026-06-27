"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { CalendarDays, ChevronLeft, ChevronRight, Clock3, Filter, Plus, Trash2, X } from "lucide-react";
import {
  Badge,
  Button,
  Input,
  IconButton,
  PageHeader,
  PageWrapper,
  SearchInput,
  Select,
  StatCard,
  Table,
} from "@/components/ui";

const usuarioMock = { name: "Pessoa B", role: "Administrador" };
const statusAtivos = ["Pendente", "Aprovada"];

function formatarData(data) {
  if (!data) return "-";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(data));
}

function formatarDataCurta(data) {
  if (!data) return "-";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(new Date(data));
}

function ehHoje(data) {
  const dataReserva = new Date(data);
  const hoje = new Date();
  return dataReserva.getFullYear() === hoje.getFullYear()
    && dataReserva.getMonth() === hoje.getMonth()
    && dataReserva.getDate() === hoje.getDate();
}

function chaveData(data) {
  const valor = new Date(data);
  return `${valor.getFullYear()}-${String(valor.getMonth() + 1).padStart(2, "0")}-${String(valor.getDate()).padStart(2, "0")}`;
}

function formatarHora(data) {
  if (!data) return "-";
  return new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(data));
}

function tituloMes(data) {
  return new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(data);
}

function varianteStatus(status) {
  if (status === "Pendente") return "orange";
  if (status === "Aprovada") return "green";
  if (status === "Reprovada") return "red";
  return "blue";
}

function Mensagem({ tipo, children }) {
  if (!children) return null;
  const classes = tipo === "erro"
    ? "border-red-200 bg-red-50 text-red-700"
    : "border-green-200 bg-green-50 text-green-700";

  return <div className={`rounded-[8px] border px-4 py-3 text-sm font-medium ${classes}`}>{children}</div>;
}

export default function ReservasPage() {
  const { data: session, status: statusSessao } = useSession();
  const perfil = session?.user?.perfil;
  const ehMorador = perfil === "morador";
  const ehGestor = ["sindico", "administrador", "adminMaster"].includes(perfil);

  const [areas, setAreas] = useState([]);
  const [areaSelecionadaId, setAreaSelecionadaId] = useState("");
  const [reservasMorador, setReservasMorador] = useState([]);
  const [reservasAdmin, setReservasAdmin] = useState([]);
  const [minhasReservas, setMinhasReservas] = useState([]);
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState("todas");
  const [mesExibido, setMesExibido] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [formReserva, setFormReserva] = useState({ areaComumId: "", dataHora: "" });
  const [salvandoReserva, setSalvandoReserva] = useState(false);

  const [carregandoAreas, setCarregandoAreas] = useState(true);
  const [carregandoMorador, setCarregandoMorador] = useState(false);
  const [carregandoAdmin, setCarregandoAdmin] = useState(true);
  const [carregandoMinhas, setCarregandoMinhas] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  async function buscarAreas() {
    setCarregandoAreas(true);
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
      const res = await fetch("/api/reservas");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao buscar reservas");
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

  async function buscarMinhasReservas() {
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
  }

  useEffect(() => {
    if (statusSessao !== "authenticated") return;

    const timer = window.setTimeout(() => {
      buscarAreas();
      if (ehGestor) buscarReservasAdmin();
      if (ehMorador) buscarMinhasReservas();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [statusSessao, ehGestor, ehMorador]);

  useEffect(() => {
    if (!ehMorador || !areaSelecionadaId) return;

    const timer = window.setTimeout(() => {
      buscarReservasMorador(areaSelecionadaId);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [ehMorador, areaSelecionadaId]);

  async function cancelarReserva(id) {
    if (!window.confirm("Deseja realmente cancelar esta reserva?")) return;
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
  }

  function abrirSolicitacao() {
    setFormReserva({ areaComumId: areaSelecionadaId, dataHora: "" });
    setErro("");
    setSucesso("");
    setMostrarFormulario(true);
  }

  async function solicitarReserva(event) {
    event.preventDefault();
    setSalvandoReserva(true);
    setErro("");
    setSucesso("");

    try {
      const res = await fetch("/api/reservas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formReserva),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao solicitar reserva");

      setSucesso("Solicitação de reserva enviada para aprovação.");
      setMostrarFormulario(false);
      buscarMinhasReservas();
    } catch (err) {
      setErro(err.message);
    } finally {
      setSalvandoReserva(false);
    }
  }

  async function avaliarReserva(id, novoStatus) {
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

      setSucesso(
        data.emailEnviado
          ? `Reserva ${novoStatus.toLowerCase()} e e-mail de confirmação enviado.`
          : `Reserva ${novoStatus.toLowerCase()} com sucesso. O e-mail não pôde ser enviado.`,
      );
      buscarReservasAdmin();
    } catch (err) {
      setErro(err.message);
    }
  }

  const pendentes = useMemo(
    () => reservasAdmin.filter((reserva) => reserva.status === "Pendente"),
    [reservasAdmin],
  );
  const reservasRecentes = useMemo(
    () => reservasAdmin.filter((reserva) => ["Aprovada", "Reprovada"].includes(reserva.status)).slice(0, 5),
    [reservasAdmin],
  );
  const reservasPendentesFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return pendentes.filter((reserva) => {
      const correspondeBusca = !termo || `${reserva.morador?.usuario?.nome || ""} ${reserva.areaComum?.nome || ""}`.toLowerCase().includes(termo);
      const correspondeFiltro = filtro === "todas" || reserva.areaComumId === Number(filtro);
      return correspondeBusca && correspondeFiltro;
    });
  }, [busca, filtro, pendentes]);
  const reservasAprovadasHoje = useMemo(
    () => reservasAdmin.filter((reserva) => reserva.status === "Aprovada" && ehHoje(reserva.dataHora)).length,
    [reservasAdmin],
  );
  const opcoesAreas = useMemo(() => {
    const opcoes = areas.map((area) => ({ value: String(area.id), label: area.nome }));
    return carregandoAreas ? [{ value: "", label: "Carregando áreas..." }] : opcoes.length ? opcoes : [{ value: "", label: "Nenhuma área cadastrada" }];
  }, [areas, carregandoAreas]);
  const diasCalendario = useMemo(() => {
    const primeiroDia = new Date(mesExibido.getFullYear(), mesExibido.getMonth(), 1);
    const ultimoDia = new Date(mesExibido.getFullYear(), mesExibido.getMonth() + 1, 0);
    const inicio = (primeiroDia.getDay() + 6) % 7;
    const totalCelulas = Math.ceil((inicio + ultimoDia.getDate()) / 7) * 7;

    return Array.from({ length: totalCelulas }, (_, indice) => {
      const dia = indice - inicio + 1;
      return dia > 0 && dia <= ultimoDia.getDate() ? new Date(mesExibido.getFullYear(), mesExibido.getMonth(), dia) : null;
    });
  }, [mesExibido]);
  const diasReservados = useMemo(
    () => new Set(reservasMorador.map((reserva) => chaveData(reserva.dataHora))),
    [reservasMorador],
  );

  if (statusSessao === "loading") return null;

  if (ehGestor) {
    return (
      <PageWrapper>
        <PageHeader title="Reservas" user={usuarioMock} />

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <StatCard label="Reservas Pendentes" value={pendentes.length} />
          <StatCard label="Áreas Reservadas Hoje" value={`${reservasAprovadasHoje}/${areas.length}`} />
        </section>

        {erro && <Mensagem tipo="erro">{erro}</Mensagem>}
        {sucesso && <Mensagem tipo="sucesso">{sucesso}</Mensagem>}

        <section className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex w-full flex-col gap-3 sm:flex-row lg:max-w-[520px]">
              <SearchInput placeholder="Buscar solicitações..." value={busca} onChange={(event) => setBusca(event.target.value)} />
              <label className="input-icon-wrapper shrink-0">
                <Filter className="input-icon" size={16} />
                <select value={filtro} onChange={(event) => setFiltro(event.target.value)} className="input input-with-icon min-w-[155px] appearance-none">
                  <option value="todas">Filtro</option>
                  {areas.map((area) => <option key={area.id} value={area.id}>{area.nome}</option>)}
                </select>
              </label>
            </div>
            <Button onClick={() => { window.location.href = "/areas-comuns"; }} className="justify-center whitespace-nowrap">
              Registrar Área
              <Plus size={18} />
            </Button>
          </div>

          <Table title="Solicitações Pendentes" columns={["Nome", "Área Solicitada", "Data Solicitada", "Ações"]}>
            {carregandoAdmin ? (
              <tr className="table-row"><td className="table-cell" colSpan={4}>Carregando solicitações...</td></tr>
            ) : reservasPendentesFiltradas.length === 0 ? (
              <tr className="table-row"><td className="table-cell" colSpan={4}>Nenhuma solicitação pendente.</td></tr>
            ) : reservasPendentesFiltradas.map((reserva) => (
              <tr key={reserva.id} className="table-row">
                <td className="table-cell font-medium">{reserva.morador?.usuario?.nome || "-"}</td>
                <td className="table-cell">{reserva.areaComum?.nome || "-"}</td>
                <td className="table-cell">{formatarDataCurta(reserva.criadoEm)}</td>
                <td className="table-cell">
                  <div className="flex flex-wrap items-center gap-2">
                    <Button variant="outline-green" onClick={() => avaliarReserva(reserva.id, "Aprovada")}>Aprovar</Button>
                    <Button variant="outline-red" onClick={() => avaliarReserva(reserva.id, "Reprovada")}>Reprovar</Button>
                  </div>
                </td>
              </tr>
            ))}
          </Table>

          <Table title="Reservas Recentes" columns={["Nome", "Área Solicitada", "Data Solicitada", "Status"]}>
            {carregandoAdmin ? (
              <tr className="table-row"><td className="table-cell" colSpan={4}>Carregando reservas...</td></tr>
            ) : reservasRecentes.length === 0 ? (
              <tr className="table-row"><td className="table-cell" colSpan={4}>Nenhuma reserva avaliada ainda.</td></tr>
            ) : reservasRecentes.map((reserva) => (
              <tr key={reserva.id} className="table-row">
                <td className="table-cell font-medium">{reserva.morador?.usuario?.nome || "-"}</td>
                <td className="table-cell">{reserva.areaComum?.nome || "-"}</td>
                <td className="table-cell">{formatarDataCurta(reserva.criadoEm)}</td>
                <td className={`table-cell font-medium ${reserva.status === "Aprovada" ? "text-green-600" : "text-red-600"}`}>{reserva.status}</td>
              </tr>
            ))}
          </Table>
        </section>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <PageHeader title="Reservas" />
      {erro && <Mensagem tipo="erro">{erro}</Mensagem>}
      {sucesso && <Mensagem tipo="sucesso">{sucesso}</Mensagem>}

      <section className="flex flex-col gap-4">
        <div>
          <h2 className="text-[24px] font-semibold leading-8 text-gray-950">Calendário de Reservas</h2>
          <p className="mt-1 text-sm text-[#582688]">Visualize as reservas aprovadas por área.</p>
        </div>

        <article className="table-wrapper overflow-hidden">
          <div className="flex flex-col gap-4 border-b border-[#E5E7EB] p-4 sm:flex-row sm:items-end sm:justify-between sm:p-5">
            <div className="w-full sm:max-w-[290px]">
              <Select label="Área comum" name="areaSelecionadaId" value={areaSelecionadaId} onChange={(event) => setAreaSelecionadaId(event.target.value)} options={opcoesAreas} />
            </div>
            <div className="flex items-center justify-between gap-3 sm:justify-end">
              <h3 className="text-[18px] font-semibold capitalize text-[#582688]">{tituloMes(mesExibido)}</h3>
              <div className="flex items-center gap-1 rounded-[8px] border border-[#E5E7EB] bg-white p-1">
                <IconButton icon={ChevronLeft} title="Mês anterior" onClick={() => setMesExibido((mes) => new Date(mes.getFullYear(), mes.getMonth() - 1, 1))} />
                <IconButton icon={ChevronRight} title="Próximo mês" onClick={() => setMesExibido((mes) => new Date(mes.getFullYear(), mes.getMonth() + 1, 1))} />
              </div>
            </div>
          </div>

          <div className="p-3 sm:p-5">
            <div className="grid grid-cols-7 border-b border-[#E5E7EB] pb-2 text-center text-[11px] font-semibold uppercase text-gray-400 sm:text-xs">
              {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map((dia) => <span key={dia}>{dia}</span>)}
            </div>
            <div className="grid grid-cols-7">
              {diasCalendario.map((dia, indice) => {
                const reservado = dia && diasReservados.has(chaveData(dia));
                const hoje = dia && chaveData(dia) === chaveData(new Date());
                return (
                  <div key={`${dia?.toISOString() || "vazio"}-${indice}`} className="flex min-h-[48px] items-center justify-center sm:min-h-[62px]">
                    {dia && (
                      <span
                        aria-label={reservado ? `${dia.getDate()} com reserva aprovada` : String(dia.getDate())}
                        className={`relative flex h-8 w-8 items-center justify-center rounded-full text-sm transition-colors sm:h-9 sm:w-9 ${hoje ? "bg-[#F3E8FF] font-semibold text-[#582688]" : "text-gray-700"}`}
                      >
                        {dia.getDate()}
                        {reservado && <i className="absolute -bottom-1 h-1.5 w-1.5 rounded-full bg-[#6B11B5]" />}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="mt-3 flex items-center gap-2 border-t border-[#F0F0F0] pt-3 text-xs text-gray-600"><span className="h-1.5 w-1.5 rounded-full bg-[#6B11B5]" />Reserva aprovada</div>
            {carregandoMorador && <p className="mt-3 text-sm text-gray-500">Carregando reservas aprovadas...</p>}
          </div>
        </article>

        <Button onClick={abrirSolicitacao} className="w-full justify-center py-3"><Plus size={20} />Solicitar Nova Reserva</Button>

        {mostrarFormulario && (
          <form onSubmit={solicitarReserva} className="table-wrapper p-5">
            <div className="mb-5 flex items-center justify-between gap-3"><h3 className="section-title">Solicitar nova reserva</h3><IconButton icon={X} title="Fechar formulário" onClick={() => setMostrarFormulario(false)} /></div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
              <Select label="Área comum" name="areaComumId" value={formReserva.areaComumId} onChange={(event) => setFormReserva((form) => ({ ...form, areaComumId: event.target.value }))} options={opcoesAreas} />
              <Input label="Data e horário" name="dataHora" type="datetime-local" value={formReserva.dataHora} onChange={(event) => setFormReserva((form) => ({ ...form, dataHora: event.target.value }))} required />
              <Button type="submit" disabled={salvandoReserva} className="justify-center whitespace-nowrap">{salvandoReserva ? "Enviando..." : "Solicitar reserva"}</Button>
            </div>
          </form>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-[24px] font-semibold leading-8 text-gray-700">Minhas Reservas</h2>
        {carregandoMinhas ? <div className="table-wrapper p-5 text-sm text-gray-500">Carregando reservas...</div>
          : minhasReservas.length === 0 ? <div className="table-wrapper p-5 text-sm text-gray-500">Você ainda não fez nenhuma reserva.</div>
            : minhasReservas.map((reserva) => (
              <article key={reserva.id} className="table-wrapper overflow-hidden">
                <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-[18px] font-semibold text-gray-950">{reserva.areaComum?.nome}</h3>
                    <div className="mt-2 flex flex-col gap-2 text-sm text-gray-600"><span className="flex items-center gap-2"><CalendarDays size={17} />{formatarDataCurta(reserva.dataHora)}</span><span className="flex items-center gap-2"><Clock3 size={17} />{formatarHora(reserva.dataHora)}</span></div>
                  </div>
                  <Badge label={reserva.status} variant={varianteStatus(reserva.status)} />
                </div>
                {statusAtivos.includes(reserva.status) && <div className="flex justify-center border-t border-[#C7C7C7] p-3"><Button variant="outline-red" onClick={() => cancelarReserva(reserva.id)}><Trash2 size={15} />Cancelar Reserva</Button></div>}
              </article>
            ))}
      </section>
    </PageWrapper>
  );
}
