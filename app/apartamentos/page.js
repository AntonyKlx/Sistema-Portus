"use client";

import { useEffect, useMemo, useState } from "react";
import { Edit2, Plus, SlidersHorizontal, Trash2, X } from "lucide-react";
import {
  Button,
  IconButton,
  Input,
  PageHeader,
  PageWrapper,
  SearchInput,
  StatCard,
  Table,
} from "@/components/ui";

const usuarioMock = { name: "Pessoa B", role: "Administrador" };
const formInicial = { bloco: "", andar: "", numero: "" };

export default function ApartamentosPage() {
  const [unidades, setUnidades] = useState([]);
  const [form, setForm] = useState(formInicial);
  const [editandoId, setEditandoId] = useState(null);
  const [busca, setBusca] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [filtroOcupacao, setFiltroOcupacao] = useState("todos");

  async function carregarUnidades() {
    setCarregando(true);
    setErro("");

    try {
      const response = await fetch("/api/unidades");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao buscar unidades");
      }

      setUnidades(data);
    } catch (error) {
      setErro(error.message);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    let ativo = true;

    fetch("/api/unidades")
      .then(async (response) => {
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Erro ao buscar unidades");
        }

        if (ativo) setUnidades(data);
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

  const unidadesFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return unidades.filter((unidade) => {
      const ocupada = unidade.moradores?.length > 0;
      const nomesMoradores = unidade.moradores
        ?.map((morador) => morador.usuario?.nome)
        .filter(Boolean)
        .join(" ");
      const texto = `${unidade.bloco} ${unidade.andar} ${unidade.numero} ${nomesMoradores ?? ""}`.toLowerCase();
      const passaBusca = !termo || texto.includes(termo);
      const passaFiltro =
        filtroOcupacao === "todos" ||
        (filtroOcupacao === "ocupados" && ocupada) ||
        (filtroOcupacao === "vagos" && !ocupada);

      return passaBusca && passaFiltro;
    });
  }, [busca, filtroOcupacao, unidades]);

  const totalOcupados = useMemo(
    () => unidades.filter((unidade) => unidade.moradores?.length > 0).length,
    [unidades],
  );
  const totalVagos = unidades.length - totalOcupados;

  function atualizarCampo(event) {
    const { name, value } = event.target;
    setForm((formAtual) => ({ ...formAtual, [name]: value }));
  }

  function iniciarEdicao(unidade) {
    setEditandoId(unidade.id);
    setForm({
      bloco: unidade.bloco,
      andar: String(unidade.andar),
      numero: unidade.numero,
    });
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

  function alternarFiltro() {
    setFiltroOcupacao((filtroAtual) => {
      if (filtroAtual === "todos") return "ocupados";
      if (filtroAtual === "ocupados") return "vagos";
      return "todos";
    });
  }

  async function salvarUnidade(event) {
    event.preventDefault();
    setSalvando(true);
    setMensagem("");
    setErro("");

    const url = editandoId ? `/api/unidades/${editandoId}` : "/api/unidades";
    const method = editandoId ? "PUT" : "POST";

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao salvar unidade");
      }

      setMensagem(editandoId ? "Unidade atualizada com sucesso." : "Unidade cadastrada com sucesso.");
      cancelarEdicao();
      await carregarUnidades();
    } catch (error) {
      setErro(error.message);
    } finally {
      setSalvando(false);
    }
  }

  async function removerUnidade(id) {
    const confirmou = window.confirm("Deseja remover esta unidade?");
    if (!confirmou) return;

    setMensagem("");
    setErro("");

    try {
      const response = await fetch(`/api/unidades/${id}`, { method: "DELETE" });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao remover unidade");
      }

      setMensagem(data.message || "Unidade removida com sucesso.");
      await carregarUnidades();
    } catch (error) {
      setErro(error.message);
    }
  }

  return (
    <PageWrapper>
      <PageHeader title="Apartamentos" user={usuarioMock} />

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard label="Total de Unidades" value={unidades.length} />
        <StatCard label="Ocupados" value={totalOcupados} />
        <StatCard label="Vagos" value={totalVagos} />
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex w-full flex-col gap-3 sm:flex-row lg:max-w-[520px]">
            <div className="min-w-0 flex-1">
              <SearchInput
                placeholder="Buscar apartamento..."
                value={busca}
                onChange={(event) => setBusca(event.target.value)}
              />
            </div>
            <button type="button" onClick={alternarFiltro} className="btn-filter justify-center">
              Filtro
              <SlidersHorizontal size={16} />
              {filtroOcupacao !== "todos" && (
                <span className="rounded-full bg-[#F6ECFF] px-2 py-0.5 text-[11px] font-semibold text-[#582688]">
                  {filtroOcupacao}
                </span>
              )}
            </button>
          </div>

          <Button onClick={abrirCadastro} className="justify-center">
            Cadastrar Unidade
            <Plus size={18} />
          </Button>
        </div>

        {mostrarFormulario && (
          <form onSubmit={salvarUnidade} className="table-wrapper p-5">
            <div className="mb-5 flex items-center justify-between gap-3">
              <h2 className="section-title">{editandoId ? "Editar unidade" : "Nova unidade"}</h2>
              <button
                type="button"
                onClick={cancelarEdicao}
                title="Fechar formulário"
                className="icon-btn"
              >
                <X size={17} />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_1fr_1fr_auto] md:items-end">
              <Input label="Bloco" name="bloco" value={form.bloco} onChange={atualizarCampo} required />
              <Input label="Andar" name="andar" type="number" value={form.andar} onChange={atualizarCampo} required />
              <Input label="Número" name="numero" value={form.numero} onChange={atualizarCampo} required />
              <Button type="submit" className="justify-center whitespace-nowrap" disabled={salvando}>
                <Plus size={16} />
                {salvando ? "Salvando..." : editandoId ? "Salvar alterações" : "Cadastrar"}
              </Button>
            </div>
          </form>
        )}

        {mensagem && <div className="rounded-[8px] border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">{mensagem}</div>}
        {erro && <div className="rounded-[8px] border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{erro}</div>}

        <Table columns={["Apartamento", "Bloco", "Andar", "Morador", "Ações"]} title="Tabela de Apartamentos">
          {carregando ? (
            <tr className="table-row">
              <td className="table-cell" colSpan={5}>Carregando unidades...</td>
            </tr>
          ) : unidadesFiltradas.length === 0 ? (
            <tr className="table-row">
              <td className="table-cell" colSpan={5}>Nenhuma unidade encontrada.</td>
            </tr>
          ) : (
            unidadesFiltradas.map((unidade) => {
              const moradores = unidade.moradores
                ?.map((morador) => morador.usuario?.nome)
                .filter(Boolean);

              return (
                <tr key={unidade.id} className="table-row">
                  <td className="table-cell font-medium">Apt {unidade.numero}</td>
                  <td className="table-cell">Bloco {unidade.bloco}</td>
                  <td className="table-cell">{unidade.andar} Andar</td>
                  <td className="table-cell">
                    {moradores?.length ? (
                      moradores.join(", ")
                    ) : (
                      <span className="inline-flex min-w-[84px] justify-center rounded-full bg-gray-200 px-3 py-1 text-xs font-medium text-gray-600">
                        Vago
                      </span>
                    )}
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center gap-2">
                      <IconButton icon={Edit2} title="Editar unidade" onClick={() => iniciarEdicao(unidade)} />
                      <IconButton icon={Trash2} title="Remover unidade" onClick={() => removerUnidade(unidade.id)} />
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </Table>
      </section>
    </PageWrapper>
  );
}
