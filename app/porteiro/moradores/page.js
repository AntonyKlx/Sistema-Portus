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
  Select,
  StatCard,
  Table,
} from "@/components/ui";
import { Badge } from "@/components/ui";

const usuarioMock = { name: "Pessoa B", role: "Administrador" };

const formInicial = {
  nome: "",
  email: "",
  senha: "",
  telefone: "",
  unidadeId: "",
  inadimplente: false,
  ativo: true,
};

export default function MoradoresPage() {
  const [moradores, setMoradores] = useState([]);
  const [unidades, setUnidades] = useState([]);
  const [form, setForm] = useState(formInicial);
  const [editandoId, setEditandoId] = useState(null);
  const [busca, setBusca] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  async function carregarMoradores() {
    setCarregando(true);
    setErro("");
    try {
      const response = await fetch("/api/moradores");
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Erro ao buscar moradores");
      setMoradores(data);
    } catch (error) {
      setErro(error.message);
    } finally {
      setCarregando(false);
    }
  }

  async function carregarUnidades() {
    try {
      const response = await fetch("/api/unidades");
      const data = await response.json();
      if (response.ok) setUnidades(data);
    } catch {
      // silencioso — unidades são auxiliares
    }
  }

  useEffect(() => {
    let ativo = true;

    Promise.all([fetch("/api/moradores"), fetch("/api/unidades")])
      .then(async ([resMoradores, resUnidades]) => {
        const [dataMoradores, dataUnidades] = await Promise.all([
          resMoradores.json(),
          resUnidades.json(),
        ]);
        if (ativo) {
          if (resMoradores.ok) setMoradores(dataMoradores);
          else setErro(dataMoradores.error || "Erro ao buscar moradores");
          if (resUnidades.ok) setUnidades(dataUnidades);
        }
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

  const moradoresFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return moradores;

    return moradores.filter((m) => {
      const unidadeTexto = m.unidade
        ? `${m.unidade.bloco} ${m.unidade.numero}`
        : "";
      const texto = `${m.usuario?.nome ?? ""} ${m.usuario?.email ?? ""} ${m.telefone ?? ""} ${unidadeTexto}`.toLowerCase();
      return texto.includes(termo);
    });
  }, [busca, moradores]);

  const inadimplentesCount = useMemo(
    () => moradores.filter((m) => m.inadimplente).length,
    [moradores]
  );

  function atualizarCampo(event) {
    const { name, value, type, checked } = event.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  }

  function iniciarEdicao(morador) {
    setEditandoId(morador.id);
    setForm({
      nome: morador.usuario?.nome ?? "",
      email: morador.usuario?.email ?? "",
      senha: "",
      telefone: morador.telefone ?? "",
      unidadeId: String(morador.unidade?.id ?? ""),
      inadimplente: morador.inadimplente ?? false,
      ativo: morador.usuario?.ativo ?? true,
    });
    setMensagem("");
    setErro("");
  }

  function cancelarEdicao() {
    setEditandoId(null);
    setForm(formInicial);
  }

  async function salvarMorador(event) {
    event.preventDefault();
    setSalvando(true);
    setMensagem("");
    setErro("");

    const url = editandoId ? `/api/moradores/${editandoId}` : "/api/moradores";
    const method = editandoId ? "PUT" : "POST";

    // No modo edição a senha é opcional
    const body = { ...form };
    if (editandoId && !body.senha) delete body.senha;

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Erro ao salvar morador");

      setMensagem(
        editandoId ? "Morador atualizado com sucesso." : "Morador cadastrado com sucesso."
      );
      cancelarEdicao();
      await carregarMoradores();
    } catch (error) {
      setErro(error.message);
    } finally {
      setSalvando(false);
    }
  }

  async function removerMorador(id) {
    const confirmou = window.confirm("Deseja remover este morador? O usuário também será excluído.");
    if (!confirmou) return;

    setMensagem("");
    setErro("");

    try {
      const response = await fetch(`/api/moradores/${id}`, { method: "DELETE" });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Erro ao remover morador");

      setMensagem(data.message || "Morador removido com sucesso.");
      await carregarMoradores();
    } catch (error) {
      setErro(error.message);
    }
  }

  const unidadesOptions = unidades.map((u) => ({
    value: String(u.id),
    label: `Bloco ${u.bloco} — Apto ${u.numero} (${u.andar}º andar)`,
  }));

  return (
    <PageWrapper>
      <PageHeader title="Cadastro de moradores" user={usuarioMock} />

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard label="Moradores cadastrados" value={moradores.length} />
        <StatCard label="Inadimplentes" value={inadimplentesCount} />
        <StatCard label="Exibindo" value={moradoresFiltrados.length} />
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[380px_1fr]">
        {/* Formulário */}
        <form onSubmit={salvarMorador} className="table-wrapper h-fit p-5">
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2 className="section-title">
              {editandoId ? "Editar morador" : "Novo morador"}
            </h2>
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
              label="Nome completo"
              name="nome"
              value={form.nome}
              onChange={atualizarCampo}
              required
            />
            <Input
              label="E-mail"
              name="email"
              type="email"
              value={form.email}
              onChange={atualizarCampo}
              required
            />
            <Input
              label={editandoId ? "Nova senha (deixe em branco para manter)" : "Senha"}
              name="senha"
              type="password"
              value={form.senha}
              onChange={atualizarCampo}
              required={!editandoId}
            />
            <Input
              label="Telefone"
              name="telefone"
              value={form.telefone}
              onChange={atualizarCampo}
              required
            />

            <Select
              label="Unidade (apartamento)"
              name="unidadeId"
              value={form.unidadeId}
              onChange={atualizarCampo}
              options={[
                { value: "", label: "Selecione a unidade" },
                ...unidadesOptions,
              ]}
              required
            />

            {/* Checkboxes */}
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  name="inadimplente"
                  checked={form.inadimplente}
                  onChange={atualizarCampo}
                  className="h-4 w-4 rounded border-gray-300 accent-purple-600"
                />
                Marcar como inadimplente
              </label>

              {editandoId && (
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    name="ativo"
                    checked={form.ativo}
                    onChange={atualizarCampo}
                    className="h-4 w-4 rounded border-gray-300 accent-purple-600"
                  />
                  Conta ativa
                </label>
              )}
            </div>

            <Button type="submit" className="justify-center" disabled={salvando}>
              <Plus size={16} />
              {salvando
                ? "Salvando..."
                : editandoId
                ? "Salvar alterações"
                : "Cadastrar morador"}
            </Button>
          </div>
        </form>

        {/* Listagem */}
        <section className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h2 className="section-title">Moradores</h2>
            <div className="w-full md:w-80">
              <SearchInput
                placeholder="Buscar por nome, e-mail, unidade..."
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

          <Table columns={["Nome", "Contato", "Unidade", "Status", "Ações"]}>
            {carregando ? (
              <tr className="table-row">
                <td className="table-cell" colSpan={5}>
                  Carregando moradores...
                </td>
              </tr>
            ) : moradoresFiltrados.length === 0 ? (
              <tr className="table-row">
                <td className="table-cell" colSpan={5}>
                  Nenhum morador encontrado.
                </td>
              </tr>
            ) : (
              moradoresFiltrados.map((m) => (
                <tr key={m.id} className="table-row">
                  <td className="table-cell">
                    <div className="font-medium text-gray-900">{m.usuario?.nome}</div>
                    <div className="text-xs text-gray-400">{m.usuario?.email}</div>
                  </td>
                  <td className="table-cell text-sm text-gray-600">{m.telefone}</td>
                  <td className="table-cell">
                    {m.unidade ? (
                      <span className="text-sm">
                        Bloco {m.unidade.bloco} — Apto {m.unidade.numero}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-400">Sem unidade</span>
                    )}
                  </td>
                  <td className="table-cell">
                    <div className="flex flex-col gap-1">
                      {m.inadimplente && (
                        <Badge label="Inadimplente" variant="red" />
                      )}
                      {!m.usuario?.ativo && (
                        <Badge label="Inativo" variant="orange" />
                      )}
                      {!m.inadimplente && m.usuario?.ativo && (
                        <Badge label="Regular" variant="green" />
                      )}
                    </div>
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center gap-2">
                      <IconButton
                        icon={Edit2}
                        title="Editar morador"
                        onClick={() => iniciarEdicao(m)}
                      />
                      <IconButton
                        icon={Trash2}
                        title="Remover morador"
                        onClick={() => removerMorador(m.id)}
                      />
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