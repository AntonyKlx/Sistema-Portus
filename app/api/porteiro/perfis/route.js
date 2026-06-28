"use client";

import { useEffect, useMemo, useState } from "react";
import { Edit2, Plus, Trash2, X } from "lucide-react";
import {
  Badge,
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
const formInicial = { nome: "", permissoes: [] };
const PERFIS_PADRAO = ["morador", "porteiro", "sindico"];

export default function PerfisAcessoPage() {
  const [perfis, setPerfis] = useState([]);
  const [form, setForm] = useState(formInicial);
  const [novaPermissao, setNovaPermissao] = useState("");
  const [editandoId, setEditandoId] = useState(null);
  const [busca, setBusca] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  async function carregarPerfis() {
    setCarregando(true);
    setErro("");
    try {
      const response = await fetch("/api/perfis");
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Erro ao buscar perfis");
      setPerfis(data);
    } catch (error) {
      setErro(error.message);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    let ativo = true;

    fetch("/api/perfis")
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Erro ao buscar perfis");
        if (ativo) setPerfis(data);
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

  const perfisFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return perfis;

    return perfis.filter((perfil) => {
      const permissoesTexto = perfil.permissoes.map((p) => p.nome).join(" ");
      const texto = `${perfil.nome} ${permissoesTexto}`.toLowerCase();
      return texto.includes(termo);
    });
  }, [busca, perfis]);

  const totalPermissoes = useMemo(
    () => perfis.reduce((soma, perfil) => soma + perfil.permissoes.length, 0),
    [perfis]
  );

  function atualizarNome(event) {
    setForm((f) => ({ ...f, nome: event.target.value }));
  }

  function adicionarPermissao() {
    const valor = novaPermissao.trim();
    if (!valor) return;
    if (form.permissoes.includes(valor)) {
      setNovaPermissao("");
      return;
    }
    setForm((f) => ({ ...f, permissoes: [...f.permissoes, valor] }));
    setNovaPermissao("");
  }

  function removerPermissao(permissao) {
    setForm((f) => ({
      ...f,
      permissoes: f.permissoes.filter((p) => p !== permissao),
    }));
  }

  function aoTeclarPermissao(event) {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      adicionarPermissao();
    }
  }

  function iniciarEdicao(perfil) {
    setEditandoId(perfil.id);
    setForm({
      nome: perfil.nome,
      permissoes: perfil.permissoes.map((p) => p.nome),
    });
    setNovaPermissao("");
    setMensagem("");
    setErro("");
  }

  const editandoPerfilPadrao =
    editandoId !== null && PERFIS_PADRAO.includes(form.nome.toLowerCase());

  function cancelarEdicao() {
    setEditandoId(null);
    setForm(formInicial);
    setNovaPermissao("");
  }

  async function salvarPerfil(event) {
    event.preventDefault();
    setSalvando(true);
    setMensagem("");
    setErro("");

    const url = editandoId ? `/api/perfis/${editandoId}` : "/api/perfis";
    const method = editandoId ? "PUT" : "POST";

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Erro ao salvar perfil");

      setMensagem(editandoId ? "Perfil atualizado com sucesso." : "Perfil cadastrado com sucesso.");
      cancelarEdicao();
      await carregarPerfis();
    } catch (error) {
      setErro(error.message);
    } finally {
      setSalvando(false);
    }
  }

  async function removerPerfil(id) {
    const confirmou = window.confirm("Deseja remover este perfil de acesso?");
    if (!confirmou) return;

    setMensagem("");
    setErro("");

    try {
      const response = await fetch(`/api/perfis/${id}`, { method: "DELETE" });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Erro ao remover perfil");

      setMensagem(data.message || "Perfil removido com sucesso.");
      await carregarPerfis();
    } catch (error) {
      setErro(error.message);
    }
  }

  return (
    <PageWrapper>
      <PageHeader title="Perfis de acesso" user={usuarioMock} />

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard label="Perfis cadastrados" value={perfis.length} />
        <StatCard label="Permissões no total" value={totalPermissoes} />
        <StatCard label="Exibindo" value={perfisFiltrados.length} />
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[380px_1fr]">
        {/* Formulário */}
        <form onSubmit={salvarPerfil} className="table-wrapper h-fit p-5">
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2 className="section-title">{editandoId ? "Editar perfil" : "Novo perfil"}</h2>
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
            <Input
              label="Nome do perfil"
              name="nome"
              value={form.nome}
              onChange={atualizarNome}
              placeholder="ex: sindico"
              required
              disabled={editandoPerfilPadrao}
            />
            {editandoPerfilPadrao && (
              <p className="-mt-2 text-xs text-orange-600">
                Este é um perfil padrão do sistema. O nome não pode ser alterado, apenas as permissões.
              </p>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-gray-700">
                Permissões
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={novaPermissao}
                  onChange={(event) => setNovaPermissao(event.target.value)}
                  onKeyDown={aoTeclarPermissao}
                  placeholder="ex: gerenciar_usuarios"
                  className="input flex-1"
                />
                <button
                  type="button"
                  onClick={adicionarPermissao}
                  className="icon-btn"
                  title="Adicionar permissão"
                >
                  <Plus size={17} />
                </button>
              </div>

              {form.permissoes.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {form.permissoes.map((permissao) => (
                    <span
                      key={permissao}
                      className="badge badge-purple flex items-center gap-1.5"
                    >
                      {permissao}
                      <button
                        type="button"
                        onClick={() => removerPermissao(permissao)}
                        className="hover:opacity-70"
                        title="Remover permissão"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="mt-1 text-xs text-gray-400">
                  Nenhuma permissão adicionada. Digite e pressione Enter.
                </p>
              )}
            </div>

            <Button type="submit" className="justify-center" disabled={salvando}>
              <Plus size={16} />
              {salvando ? "Salvando..." : editandoId ? "Salvar alterações" : "Cadastrar perfil"}
            </Button>
          </div>
        </form>

        {/* Listagem */}
        <section className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h2 className="section-title">Perfis</h2>
            <div className="w-full md:w-80">
              <SearchInput
                placeholder="Buscar por nome ou permissão..."
                value={busca}
                onChange={(event) => setBusca(event.target.value)}
              />
            </div>
          </div>

          {mensagem && (
            <div className="rounded-[8px] border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
              {mensagem}
            </div>
          )}
          {erro && (
            <div className="rounded-[8px] border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {erro}
            </div>
          )}

          <Table columns={["Perfil", "Permissões", "Usuários", "Ações"]}>
            {carregando ? (
              <tr className="table-row">
                <td className="table-cell" colSpan={4}>Carregando perfis...</td>
              </tr>
            ) : perfisFiltrados.length === 0 ? (
              <tr className="table-row">
                <td className="table-cell" colSpan={4}>Nenhum perfil encontrado.</td>
              </tr>
            ) : (
              perfisFiltrados.map((perfil) => {
                const ehPadrao = PERFIS_PADRAO.includes(perfil.nome.toLowerCase());
                return (
                <tr key={perfil.id} className="table-row">
                  <td className="table-cell font-medium text-gray-900">
                    <div className="flex items-center gap-2">
                      {perfil.nome}
                      {ehPadrao && <Badge label="Padrão" variant="orange" />}
                    </div>
                  </td>
                  <td className="table-cell">
                    {perfil.permissoes.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {perfil.permissoes.map((p) => (
                          <Badge key={p.id} label={p.nome} variant="purple" />
                        ))}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">Sem permissões</span>
                    )}
                  </td>
                  <td className="table-cell">
                    <Badge
                      label={`${perfil._count.usuarios} usuário${perfil._count.usuarios === 1 ? "" : "s"}`}
                      variant={perfil._count.usuarios > 0 ? "blue" : "orange"}
                    />
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center gap-2">
                      <IconButton icon={Edit2} title="Editar permissões do perfil" onClick={() => iniciarEdicao(perfil)} />
                      {!ehPadrao && (
                        <IconButton icon={Trash2} title="Remover perfil" onClick={() => removerPerfil(perfil.id)} />
                      )}
                    </div>
                  </td>
                </tr>
                );
              })
            )}
          </Table>
        </section>
      </section>
    </PageWrapper>
  );
}