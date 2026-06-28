"use client";

import { useEffect, useMemo, useState } from "react";
import { Edit2, Plus, Trash2, X } from "lucide-react";
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
const formInicial = { nome: "", descricao: "" };

export default function AreasComunsPage() {
  const [areas, setAreas] = useState([]);
  const [form, setForm] = useState(formInicial);
  const [editandoId, setEditandoId] = useState(null);
  const [busca, setBusca] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  async function carregarAreas() {
    setCarregando(true);
    setErro("");

    try {
      const response = await fetch("/api/porteiro/areas-comuns");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao buscar áreas comuns");
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
          throw new Error(data.error || "Erro ao buscar áreas comuns");
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

  function atualizarCampo(event) {
    const { name, value } = event.target;
    setForm((formAtual) => ({ ...formAtual, [name]: value }));
  }

  function iniciarEdicao(area) {
    setEditandoId(area.id);
    setForm({
      nome: area.nome,
      descricao: area.descricao || "",
    });
    setMensagem("");
    setErro("");
  }

  function cancelarEdicao() {
    setEditandoId(null);
    setForm(formInicial);
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
        throw new Error(data.error || "Erro ao salvar área comum");
      }

      setMensagem(editandoId ? "Área comum atualizada com sucesso." : "Área comum cadastrada com sucesso.");
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
    const confirmouDelete = window.confirm("Deseja remover esta área comum?");
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
          throw new Error(confirmacao.data.error || "Erro ao remover área comum");
        }

        setMensagem(confirmacao.data.message || "Área comum removida com sucesso.");
        await carregarAreas();
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || "Erro ao remover área comum");
      }

      setMensagem(data.message || "Área comum removida com sucesso.");
      await carregarAreas();
    } catch (error) {
      setErro(error.message);
    }
  }

  return (
    <PageWrapper>
      <PageHeader title="Cadastro de áreas comuns" user={usuarioMock} />

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard label="Áreas cadastradas" value={areas.length} />
        <StatCard label="Com descrição" value={areas.filter((area) => area.descricao).length} />
        <StatCard label="Exibindo" value={areasFiltradas.length} />
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[360px_1fr]">
        <form onSubmit={salvarArea} className="table-wrapper h-fit p-5">
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2 className="section-title">{editandoId ? "Editar área comum" : "Nova área comum"}</h2>
            {editandoId && (
              <button
                type="button"
                onClick={cancelarEdicao}
                title="Cancelar edição"
                className="icon-btn"
              >
                <X size={17} />
              </button>
            )}
          </div>

          <div className="flex flex-col gap-4">
            <Input label="Nome" name="nome" value={form.nome} onChange={atualizarCampo} required />
            <Input label="Descrição" name="descricao" value={form.descricao} onChange={atualizarCampo} />

            <Button type="submit" className="justify-center" disabled={salvando}>
              <Plus size={16} />
              {salvando ? "Salvando..." : editandoId ? "Salvar alterações" : "Cadastrar área"}
            </Button>
          </div>
        </form>

        <section className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h2 className="section-title">Áreas comuns</h2>
            <div className="w-full md:w-80">
              <SearchInput placeholder="Buscar por nome ou descrição" value={busca} onChange={(event) => setBusca(event.target.value)} />
            </div>
          </div>

          {mensagem && <div className="rounded-[8px] border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">{mensagem}</div>}
          {erro && <div className="rounded-[8px] border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{erro}</div>}

          <Table columns={["Nome", "Descrição", "Ações"]}>
            {carregando ? (
              <tr className="table-row">
                <td className="table-cell" colSpan={3}>Carregando áreas comuns...</td>
              </tr>
            ) : areasFiltradas.length === 0 ? (
              <tr className="table-row">
                <td className="table-cell" colSpan={3}>Nenhuma área comum encontrada.</td>
              </tr>
            ) : (
              areasFiltradas.map((area) => (
                <tr key={area.id} className="table-row">
                  <td className="table-cell font-medium">{area.nome}</td>
                  <td className="table-cell">{area.descricao || "-"}</td>
                  <td className="table-cell">
                    <div className="flex items-center gap-2">
                      <IconButton icon={Edit2} title="Editar área comum" onClick={() => iniciarEdicao(area)} />
                      <IconButton icon={Trash2} title="Remover área comum" onClick={() => removerArea(area.id)} />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </Table>
        </section>
      </section>
    </PageWrapper>
  );
}
