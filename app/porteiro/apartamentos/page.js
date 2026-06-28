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

  async function carregarUnidades() {
    setCarregando(true);
    setErro("");

    try {
      const response = await fetch("/api/porteiro/unidades");
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

    fetch("/api/porteiro/unidades")
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
    if (!termo) return unidades;

    return unidades.filter((unidade) => {
      const texto = `${unidade.bloco} ${unidade.andar} ${unidade.numero}`.toLowerCase();
      return texto.includes(termo);
    });
  }, [busca, unidades]);

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
    setMensagem("");
    setErro("");
  }

  function cancelarEdicao() {
    setEditandoId(null);
    setForm(formInicial);
  }

  async function salvarUnidade(event) {
    event.preventDefault();
    setSalvando(true);
    setMensagem("");
    setErro("");

    const url = editandoId ? `/api/porteiro/unidades/${editandoId}` : "/api/porteiro/unidades";
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
      const response = await fetch(`/api/porteiro/unidades/${id}`, { method: "DELETE" });
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
      <PageHeader title="Cadastro de apartamentos" user={usuarioMock} />

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard label="Unidades cadastradas" value={unidades.length} />
        <StatCard label="Blocos" value={new Set(unidades.map((unidade) => unidade.bloco)).size} />
        <StatCard label="Exibindo" value={unidadesFiltradas.length} />
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[360px_1fr]">
        <form onSubmit={salvarUnidade} className="table-wrapper h-fit p-5">
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2 className="section-title">{editandoId ? "Editar unidade" : "Nova unidade"}</h2>
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
            <Input label="Bloco" name="bloco" value={form.bloco} onChange={atualizarCampo} required />
            <Input label="Andar" name="andar" type="number" value={form.andar} onChange={atualizarCampo} required />
            <Input label="Número" name="numero" value={form.numero} onChange={atualizarCampo} required />

            <Button type="submit" className="justify-center" disabled={salvando}>
              <Plus size={16} />
              {salvando ? "Salvando..." : editandoId ? "Salvar alterações" : "Cadastrar unidade"}
            </Button>
          </div>
        </form>

        <section className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h2 className="section-title">Unidades</h2>
            <div className="w-full md:w-80">
              <SearchInput placeholder="Buscar por bloco, andar ou número" value={busca} onChange={(event) => setBusca(event.target.value)} />
            </div>
          </div>

          {mensagem && <div className="rounded-[8px] border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">{mensagem}</div>}
          {erro && <div className="rounded-[8px] border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{erro}</div>}

          <Table columns={["Bloco", "Andar", "Número", "Ações"]}>
            {carregando ? (
              <tr className="table-row">
                <td className="table-cell" colSpan={4}>Carregando unidades...</td>
              </tr>
            ) : unidadesFiltradas.length === 0 ? (
              <tr className="table-row">
                <td className="table-cell" colSpan={4}>Nenhuma unidade encontrada.</td>
              </tr>
            ) : (
              unidadesFiltradas.map((unidade) => (
                <tr key={unidade.id} className="table-row">
                  <td className="table-cell font-medium">{unidade.bloco}</td>
                  <td className="table-cell">{unidade.andar}</td>
                  <td className="table-cell">{unidade.numero}</td>
                  <td className="table-cell">
                    <div className="flex items-center gap-2">
                      <IconButton icon={Edit2} title="Editar unidade" onClick={() => iniciarEdicao(unidade)} />
                      <IconButton icon={Trash2} title="Remover unidade" onClick={() => removerUnidade(unidade.id)} />
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
