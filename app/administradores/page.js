"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { Edit2, Plus, Trash2, X } from "lucide-react";
import {
  Badge,
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

const usuarioMock = { name: "Pessoa B", role: "Administrador" };

const formInicial = {
  nome: "",
  email: "",
  senha: "",
  nivel: "administrador",
  ativo: true,
};

const opcoesNivel = [
  { value: "administrador", label: "Administrador" },
  { value: "adminMaster", label: "Administrador Master" },
];

export default function AdminsPage() {
  const { data: session } = useSession();
  const meuId = session?.user?.id ? Number(session.user.id) : null;

  const [admins, setAdmins] = useState([]);
  const [form, setForm] = useState(formInicial);
  const [editandoId, setEditandoId] = useState(null);
  const [busca, setBusca] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  async function carregarAdmins() {
    setCarregando(true);
    setErro("");
    try {
      const response = await fetch("/api/admins");
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Erro ao buscar administradores");
      setAdmins(data);
    } catch (error) {
      setErro(error.message);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    let ativo = true;

    fetch("/api/admins")
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Erro ao buscar administradores");
        if (ativo) setAdmins(data);
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

  const adminsFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return admins;

    return admins.filter((a) => {
      const texto = `${a.nome} ${a.email} ${a.perfil?.nome ?? ""}`.toLowerCase();
      return texto.includes(termo);
    });
  }, [busca, admins]);

  const totalMasters = useMemo(
    () => admins.filter((a) => a.perfil?.nome === "adminMaster").length,
    [admins]
  );

  function atualizarCampo(event) {
    const { name, value, type, checked } = event.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  }

  function iniciarEdicao(admin) {
    setEditandoId(admin.id);
    setForm({
      nome: admin.nome,
      email: admin.email,
      senha: "",
      nivel: admin.perfil?.nome ?? "administrador",
      ativo: admin.ativo,
    });
    setMensagem("");
    setErro("");
  }

  function cancelarEdicao() {
    setEditandoId(null);
    setForm(formInicial);
  }

  async function salvarAdmin(event) {
    event.preventDefault();
    setSalvando(true);
    setMensagem("");
    setErro("");

    const url = editandoId ? `/api/admins/${editandoId}` : "/api/admins";
    const method = editandoId ? "PUT" : "POST";

    const body = { ...form };
    if (editandoId && !body.senha) delete body.senha;

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Erro ao salvar administrador");

      setMensagem(
        editandoId ? "Administrador atualizado com sucesso." : "Administrador cadastrado com sucesso."
      );
      cancelarEdicao();
      await carregarAdmins();
    } catch (error) {
      setErro(error.message);
    } finally {
      setSalvando(false);
    }
  }

  async function removerAdmin(id) {
    const confirmou = window.confirm("Deseja remover este administrador?");
    if (!confirmou) return;

    setMensagem("");
    setErro("");

    try {
      const response = await fetch(`/api/admins/${id}`, { method: "DELETE" });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Erro ao remover administrador");

      setMensagem(data.message || "Administrador removido com sucesso.");
      await carregarAdmins();
    } catch (error) {
      setErro(error.message);
    }
  }

  const editandoEhEuMesmo = editandoId !== null && editandoId === meuId;

  return (
    <PageWrapper>
      <PageHeader title="Gerenciar administradores" user={usuarioMock} />

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard label="Administradores" value={admins.length} />
        <StatCard label="Admin Masters" value={totalMasters} />
        <StatCard label="Exibindo" value={adminsFiltrados.length} />
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[380px_1fr]">
        {/* Formulário */}
        <form onSubmit={salvarAdmin} className="table-wrapper h-fit p-5">
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2 className="section-title">
              {editandoId ? "Editar administrador" : "Novo administrador"}
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

            <Select
              label="Nível de permissão"
              name="nivel"
              value={form.nivel}
              onChange={atualizarCampo}
              options={opcoesNivel}
              disabled={editandoEhEuMesmo && form.nivel === "adminMaster"}
            />
            {editandoEhEuMesmo && (
              <p className="-mt-2 text-xs text-orange-600">
                Você está editando sua própria conta. Não é possível rebaixar seu
                próprio nível nem desativá-la.
              </p>
            )}

            {editandoId && (
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  name="ativo"
                  checked={form.ativo}
                  onChange={atualizarCampo}
                  disabled={editandoEhEuMesmo}
                  className="h-4 w-4 rounded border-gray-300 accent-purple-600"
                />
                Conta ativa
              </label>
            )}

            <Button type="submit" className="justify-center" disabled={salvando}>
              <Plus size={16} />
              {salvando
                ? "Salvando..."
                : editandoId
                ? "Salvar alterações"
                : "Cadastrar administrador"}
            </Button>
          </div>
        </form>

        {/* Listagem */}
        <section className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h2 className="section-title">Administradores</h2>
            <div className="w-full md:w-80">
              <SearchInput
                placeholder="Buscar por nome, e-mail, nível..."
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

          <Table columns={["Nome", "E-mail", "Nível", "Status", "Ações"]}>
            {carregando ? (
              <tr className="table-row">
                <td className="table-cell" colSpan={5}>
                  Carregando administradores...
                </td>
              </tr>
            ) : adminsFiltrados.length === 0 ? (
              <tr className="table-row">
                <td className="table-cell" colSpan={5}>
                  Nenhum administrador encontrado.
                </td>
              </tr>
            ) : (
              adminsFiltrados.map((admin) => {
                const souEu = admin.id === meuId;
                return (
                  <tr key={admin.id} className="table-row">
                    <td className="table-cell font-medium text-gray-900">
                      <div className="flex items-center gap-2">
                        {admin.nome}
                        {souEu && <Badge label="Você" variant="blue" />}
                      </div>
                    </td>
                    <td className="table-cell text-sm text-gray-600">{admin.email}</td>
                    <td className="table-cell">
                      <Badge
                        label={admin.perfil?.nome === "adminMaster" ? "Admin Master" : "Administrador"}
                        variant={admin.perfil?.nome === "adminMaster" ? "purple" : "blue"}
                      />
                    </td>
                    <td className="table-cell">
                      <Badge label={admin.ativo ? "Ativo" : "Inativo"} variant={admin.ativo ? "green" : "orange"} />
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <IconButton
                          icon={Edit2}
                          title="Editar administrador"
                          onClick={() => iniciarEdicao(admin)}
                        />
                        {!souEu && (
                          <IconButton
                            icon={Trash2}
                            title="Remover administrador"
                            onClick={() => removerAdmin(admin.id)}
                          />
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