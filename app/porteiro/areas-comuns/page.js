"use client";

import { useEffect, useMemo, useState } from "react";
import { Clock3, Plus, Settings, Trash2, Users, X } from "lucide-react";
import {
  Button,
  Input,
  PageHeader,
  PageWrapper,
  SearchInput,
  StatCard,
} from "@/components/ui";

const usuarioMock = { name: "Pessoa B", role: "Administrador" };
const formInicial = {
  nome: "",
  descricao: "",
  antecedenciaMinimaReserva: "",
  antecedenciaMinCancelamento: "",
  limiteReservasAtivas: "",
  horarioPermitidoInicio: "",
  horarioPermitidoFim: "",
};
const statusReservaAtiva = ["Pendente", "Aprovada"];

function ehHoje(data) {
  const dataReserva = new Date(data);
  const hoje = new Date();

  return (
    dataReserva.getFullYear() === hoje.getFullYear() &&
    dataReserva.getMonth() === hoje.getMonth() &&
    dataReserva.getDate() === hoje.getDate()
  );
}

function possuiReservaAtivaHoje(area) {
  return area.reservas?.some((reserva) => statusReservaAtiva.includes(reserva.status) && ehHoje(reserva.dataHora));
}

function formatarHorario(data) {
  if (!data) return "08:00";

  const valor = new Date(data);
  if (Number.isNaN(valor.getTime())) return "08:00";

  return `${String(valor.getUTCHours()).padStart(2, "0")}:${String(valor.getUTCMinutes()).padStart(2, "0")}`;
}

function formatarAntecedencia(horas, fallback) {
  const valor = Number.isFinite(Number(horas)) ? Number(horas) : fallback;
  if (valor >= 24 && valor % 24 === 0) return `${valor / 24} dias antecedencia`;
  return `${valor}h antecedencia`;
}

export default function AreasComunsPage() {
  const [areas, setAreas] = useState([]);
  const [form, setForm] = useState(formInicial);
  const [editandoId, setEditandoId] = useState(null);
  const [busca, setBusca] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  async function carregarAreas() {
    setCarregando(true);
    setErro("");

    try {
      const response = await fetch("/api/porteiro/areas-comuns");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao buscar areas comuns");
      }

      setAreas(data);
    } catch (error) {
      setErro(error.message);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    let ativo = true;

    fetch("/api/porteiro/areas-comuns")
      .then(async (response) => {
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Erro ao buscar areas comuns");
        }

        if (ativo) setAreas(data);
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

  const areasFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return areas;

    return areas.filter((area) => {
      const texto = `${area.nome} ${area.descricao || ""}`.toLowerCase();
      return texto.includes(termo);
    });
  }, [areas, busca]);

  const reservasAtivasHoje = useMemo(
    () =>
      areas.reduce((total, area) => {
        const reservasDaArea = area.reservas?.filter(
          (reserva) => statusReservaAtiva.includes(reserva.status) && ehHoje(reserva.dataHora),
        );

        return total + (reservasDaArea?.length ?? 0);
      }, 0),
    [areas],
  );

  const areasReservadasHoje = useMemo(
    () => areas.filter((area) => possuiReservaAtivaHoje(area)).length,
    [areas],
  );

  function atualizarCampo(event) {
    const { name, value } = event.target;
    setForm((formAtual) => ({ ...formAtual, [name]: value }));
  }

  function preencherFormArea(area) {
    const regras = area.regras;

    return {
      nome: area.nome,
      descricao: area.descricao || "",
      antecedenciaMinimaReserva: String(regras?.antecedenciaMinimaReserva ?? ""),
      antecedenciaMinCancelamento: String(regras?.antecedenciaMinCancelamento ?? ""),
      limiteReservasAtivas: String(regras?.limiteReservasAtivas ?? ""),
      horarioPermitidoInicio: regras?.horarioPermitidoInicio ? formatarHorario(regras.horarioPermitidoInicio) : "",
      horarioPermitidoFim: regras?.horarioPermitidoFim ? formatarHorario(regras.horarioPermitidoFim) : "",
    };
  }

  function iniciarEdicao(area) {
    setEditandoId(area.id);
    setForm(preencherFormArea(area));
    setMostrarFormulario(true);
    setMensagem("");
    setErro("");
  }

  function cancelarEdicao() {
    setEditandoId(null);
    setForm(formInicial);
    setMostrarFormulario(false);
  }

  function abrirCadastro() {
    setEditandoId(null);
    setForm(formInicial);
    setMensagem("");
    setErro("");
    setMostrarFormulario(true);
  }

  async function salvarArea(event) {
    event.preventDefault();
    setSalvando(true);
    setMensagem("");
    setErro("");

    const url = editandoId ? `/api/porteiro/areas-comuns/${editandoId}` : "/api/porteiro/areas-comuns";
    const method = editandoId ? "PUT" : "POST";

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao salvar area comum");
      }

      setMensagem(editandoId ? "Area comum atualizada com sucesso." : "Area comum cadastrada com sucesso.");
      cancelarEdicao();
      await carregarAreas();
    } catch (error) {
      setErro(error.message);
    } finally {
      setSalvando(false);
    }
  }

  async function executarDelete(id, confirmado = false) {
    const response = await fetch(`/api/porteiro/areas-comuns/${id}${confirmado ? "?confirmar=true" : ""}`, {
      method: "DELETE",
    });
    const data = await response.json();
    return { response, data };
  }

  async function removerArea(id) {
    const confirmouDelete = window.confirm("Deseja remover esta area comum?");
    if (!confirmouDelete) return;

    setMensagem("");
    setErro("");

    try {
      const { response, data } = await executarDelete(id);

      if (response.status === 409) {
        const confirmouReservas = window.confirm(data.error || "Existem reservas vinculadas. Deseja remover mesmo assim?");
        if (!confirmouReservas) return;

        const confirmacao = await executarDelete(id, true);

        if (!confirmacao.response.ok) {
          throw new Error(confirmacao.data.error || "Erro ao remover area comum");
        }

        setMensagem(confirmacao.data.message || "Area comum removida com sucesso.");
        await carregarAreas();
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || "Erro ao remover area comum");
      }

      setMensagem(data.message || "Area comum removida com sucesso.");
      await carregarAreas();
    } catch (error) {
      setErro(error.message);
    }
  }

  return (
    <PageWrapper>
      <PageHeader title="Areas Comuns" user={usuarioMock} />

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard label="Total de Areas" value={areas.length} />
        <StatCard label="Reservas Ativas Hoje" value={reservasAtivasHoje} />
        <StatCard label="Areas Disponiveis Agora" value={Math.max(areas.length - areasReservadasHoje, 0)} />
      </section>

      <section className="flex flex-col gap-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="w-full lg:max-w-[470px]">
            <SearchInput
              placeholder="Buscar area..."
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
            />
          </div>

          <Button onClick={abrirCadastro} className="justify-center">
            Cadastrar Area
            <Plus size={18} />
          </Button>
        </div>

        {mostrarFormulario && (
          <form onSubmit={salvarArea} className="table-wrapper p-5">
            <div className="mb-5 flex items-center justify-between gap-3">
              <h2 className="section-title">{editandoId ? "Editar area comum" : "Nova area comum"}</h2>
              <button
                type="button"
                onClick={cancelarEdicao}
                title="Fechar formulario"
                className="icon-btn"
              >
                <X size={17} />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Input label="Nome" name="nome" value={form.nome} onChange={atualizarCampo} required />
              <Input label="Descricao" name="descricao" value={form.descricao} onChange={atualizarCampo} />
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
              <Input
                label="Antecedencia minima para reserva (em horas)"
                name="antecedenciaMinimaReserva"
                type="number"
                value={form.antecedenciaMinimaReserva}
                onChange={atualizarCampo}
                required
              />
              <Input
                label="Antecedencia minima para cancelamento (em horas)"
                name="antecedenciaMinCancelamento"
                type="number"
                value={form.antecedenciaMinCancelamento}
                onChange={atualizarCampo}
                required
              />
              <Input
                label="Limite de reservas ativas por morador"
                name="limiteReservasAtivas"
                type="number"
                value={form.limiteReservasAtivas}
                onChange={atualizarCampo}
                required
              />
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
              <Input
                label="Horario permitido - inicio"
                name="horarioPermitidoInicio"
                type="time"
                value={form.horarioPermitidoInicio}
                onChange={atualizarCampo}
                required
              />
              <Input
                label="Horario permitido - fim"
                name="horarioPermitidoFim"
                type="time"
                value={form.horarioPermitidoFim}
                onChange={atualizarCampo}
                required
              />
              <Button type="submit" className="justify-center whitespace-nowrap" disabled={salvando}>
                <Plus size={16} />
                {salvando ? "Salvando..." : editandoId ? "Salvar alteracoes" : "Cadastrar"}
              </Button>
            </div>
          </form>
        )}

        {mensagem && <div className="rounded-[8px] border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">{mensagem}</div>}
        {erro && <div className="rounded-[8px] border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{erro}</div>}

        {carregando ? (
          <div className="table-wrapper p-5 text-sm text-gray-500">Carregando areas comuns...</div>
        ) : areasFiltradas.length === 0 ? (
          <div className="table-wrapper p-5 text-sm text-gray-500">Nenhuma area comum encontrada.</div>
        ) : (
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            {areasFiltradas.map((area) => {
              const reservada = possuiReservaAtivaHoje(area);
              const regras = area.regras;

              return (
                <article key={area.id} className="overflow-hidden rounded-[13px] border border-[#C7C7C7] bg-white shadow-card">
                  <div className="relative h-[92px] bg-[#F3E8FF]">
                    <span className={`absolute right-3 top-3 rounded-full border px-3 py-1 text-xs font-medium ${
                      reservada
                        ? "border-[#7C3AED] text-[#7C3AED]"
                        : "border-green-500 text-green-600"
                    }`}>
                      {reservada ? "Reservado" : "Disponivel"}
                    </span>
                  </div>

                  <div className="flex flex-col gap-5 p-5">
                    <div>
                      <h2 className="text-[16px] font-semibold leading-6 text-gray-950">{area.nome}</h2>
                      <p className="text-xs text-gray-600">{area.descricao || "Espaco disponivel para reservas"}</p>
                    </div>

                    <div className="grid grid-cols-1 gap-3 text-sm text-gray-600 sm:grid-cols-2">
                      <span className="flex items-center gap-2">
                        <Clock3 size={15} />
                        {formatarHorario(regras?.horarioPermitidoInicio)}
                      </span>
                      <span className="flex items-center gap-2">
                        <Clock3 size={15} />
                        {formatarAntecedencia(regras?.antecedenciaMinimaReserva, 168)}
                      </span>
                      <span className="flex items-center gap-2">
                        <Users size={15} />
                        Max. {regras?.limiteReservasAtivas ?? 20} reservas
                      </span>
                      <span className="flex items-center gap-2">
                        <Users size={15} />
                        Canc. {regras?.antecedenciaMinCancelamento ?? 24}h antes
                      </span>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <button
                        type="button"
                        onClick={() => iniciarEdicao(area)}
                        className="inline-flex items-center justify-center gap-2 rounded-[8px] border border-[#9CA3AF] px-5 py-2.5 text-sm font-medium text-[#7C3AED] transition hover:bg-[#F6ECFF]"
                      >
                        Editar
                        <Settings size={17} />
                      </button>
                      <button
                        type="button"
                        onClick={() => removerArea(area.id)}
                        className="inline-flex items-center justify-center gap-2 rounded-[8px] border border-red-500 px-5 py-2.5 text-sm font-medium text-red-500 transition hover:bg-red-50"
                      >
                        Remover
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </PageWrapper>
  );
}
