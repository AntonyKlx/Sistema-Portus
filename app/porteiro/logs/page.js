"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Eye, Search } from "lucide-react";
import {
  Button,
  Input,
  PageHeader,
  PageWrapper,
  Select,
} from "@/components/ui";

const usuarioMock = { name: "Usuario Teste", role: "Admin" };

const opcoesPerfil = [
  { value: "", label: "Todos" },
  { value: "adminMaster", label: "Admin Master" },
  { value: "administrador", label: "Administrador" },
  { value: "sindico", label: "Sindico" },
  { value: "porteiro", label: "Porteiro" },
  { value: "morador", label: "Morador" },
];

const opcoesTipoAcao = [
  { value: "", label: "Todos" },
  { value: "cadastro", label: "Cadastro" },
  { value: "aprovacao", label: "Aprovacao" },
  { value: "reprovacao", label: "Reprovacao" },
  { value: "baixa", label: "Baixa" },
  { value: "remocao", label: "Remocao" },
];

const tipoClasses = {
  cadastro: "bg-[#DBEAFE] text-[#2563EB]",
  aprovacao: "bg-[#DCFCE7] text-[#16A34A]",
  reprovacao: "bg-[#FFE4E6] text-[#E11D48]",
  baixa: "bg-[#F3E8FF] text-[#7C3AED]",
  remocao: "bg-[#FFE4E6] text-[#E11D48]",
  outros: "bg-gray-100 text-gray-600",
};

function formatarData(data) {
  if (!data) return { data: "-", hora: "-" };

  const valor = new Date(data);
  return {
    data: new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(valor),
    hora: new Intl.DateTimeFormat("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(valor),
  };
}

function obterTipoAcao(acao = "") {
  const texto = acao.toLowerCase();

  if (texto.includes("reprov")) return { valor: "reprovacao", label: "Reprovacao" };
  if (texto.includes("aprov")) return { valor: "aprovacao", label: "Aprovacao" };
  if (texto.includes("baixa") || texto.includes("retirada")) return { valor: "baixa", label: "Baixa" };
  if (texto.includes("remov") || texto.includes("delet") || texto.includes("exclu")) return { valor: "remocao", label: "Remocao" };
  if (texto.includes("registr") || texto.includes("cadastr")) return { valor: "cadastro", label: "Cadastro" };

  return { valor: "outros", label: "Outro" };
}

function Mensagem({ tipo, children }) {
  if (!children) return null;

  const classes = tipo === "erro"
    ? "border-red-200 bg-red-50 text-red-700"
    : "border-green-200 bg-green-50 text-green-700";

  return <div className={`rounded-[8px] border px-4 py-3 text-sm font-medium ${classes}`}>{children}</div>;
}

export default function LogsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [logs, setLogs] = useState([]);
  const [filtros, setFiltros] = useState({
    busca: "",
    perfil: "",
    tipoAcao: "",
    dataInicio: "",
    dataFim: "",
  });
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
      return;
    }

    if (status === "authenticated" && session?.user?.perfil !== "adminMaster") {
      router.replace("/acesso-negado");
    }
  }, [router, session, status]);

  async function carregarLogs(filtrosAtuais = filtros) {
    setCarregando(true);
    setErro("");

    try {
      const params = new URLSearchParams();

      Object.entries(filtrosAtuais).forEach(([chave, valor]) => {
        if (String(valor).trim()) params.set(chave, valor);
      });

      const query = params.toString();
      const response = await fetch(`/api/logs${query ? `?${query}` : ""}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao buscar logs");
      }

      setLogs(Array.isArray(data) ? data : []);
    } catch (error) {
      setErro(error.message);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    if (status !== "authenticated" || session?.user?.perfil !== "adminMaster") return;

    carregarLogs();
  }, [status, session]);

  function atualizarFiltro(event) {
    const { name, value } = event.target;
    setFiltros((filtrosAtuais) => ({ ...filtrosAtuais, [name]: value }));
  }

  function aplicarFiltros(event) {
    event.preventDefault();
    carregarLogs(filtros);
  }

  const totalLogs = useMemo(() => logs.length, [logs]);

  if (status === "loading") return null;

  return (
    <PageWrapper>
      <PageHeader title="Logs" user={usuarioMock} />

      {erro && <Mensagem tipo="erro">{erro}</Mensagem>}

      <form onSubmit={aplicarFiltros} className="rounded-[8px] border border-[#D8D8D8] bg-white p-4 shadow-card">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.5fr_0.7fr_0.7fr]">
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-gray-700">Busca</label>
            <div className="input-icon-wrapper">
              <span className="input-icon">
                <Search size={16} />
              </span>
              <input
                type="text"
                name="busca"
                placeholder="Buscar por usuario ou acao..."
                value={filtros.busca}
                onChange={atualizarFiltro}
                className="input input-with-icon bg-[#F5F5F5] border-[#E5E7EB]"
              />
            </div>
          </div>

          <Select
            label="Perfil"
            name="perfil"
            value={filtros.perfil}
            onChange={atualizarFiltro}
            options={opcoesPerfil}
          />

          <Select
            label="Tipo de Acao"
            name="tipoAcao"
            value={filtros.tipoAcao}
            onChange={atualizarFiltro}
            options={opcoesTipoAcao}
          />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-[0.8fr_0.8fr_auto] md:items-end">
          <Input
            label="Inicio"
            name="dataInicio"
            type="date"
            value={filtros.dataInicio}
            onChange={atualizarFiltro}
          />
          <Input
            label="Fim"
            name="dataFim"
            type="date"
            value={filtros.dataFim}
            onChange={atualizarFiltro}
          />
          <Button type="submit" className="h-[42px] justify-center whitespace-nowrap px-5">
            Aplicar Filtros
          </Button>
        </div>
      </form>

      <section className="rounded-[8px] border border-[#D8D8D8] bg-white shadow-card">
        <div className="border-b border-[#E5E7EB] px-5 py-4">
          <h2 className="section-title">Tabela de Logs</h2>
          <p className="mt-1 text-xs text-gray-400">{totalLogs} registro{totalLogs === 1 ? "" : "s"} encontrado{totalLogs === 1 ? "" : "s"}</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#F3E8FF] text-left text-[12px] font-semibold text-gray-700">
                <th className="px-4 py-3">Data/Hora</th>
                <th className="px-4 py-3">Usuario</th>
                <th className="px-4 py-3">Perfil</th>
                <th className="px-4 py-3">Tipo de Acao</th>
              </tr>
            </thead>
            <tbody>
              {carregando ? (
                <tr>
                  <td className="px-4 py-5 text-sm text-gray-500" colSpan={5}>Carregando logs...</td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td className="px-4 py-5 text-sm text-gray-500" colSpan={5}>
                    Nenhum log encontrado para os filtros aplicados.
                  </td>
                </tr>
              ) : logs.map((log) => {
                const data = formatarData(log.dataHora);
                const tipo = obterTipoAcao(log.acaoExecutada);

                return (
                  <tr key={log.id} className="border-t border-[#F0F0F0] text-sm text-gray-700 transition hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div>{data.data}</div>
                      <div className="text-xs text-gray-500">({data.hora})</div>
                    </td>
                    <td className="px-4 py-3 font-medium">{log.usuario?.nome || "-"}</td>
                    <td className="px-4 py-3">{log.usuario?.perfil?.nome || "-"}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${tipoClasses[tipo.valor]}`}>
                        {tipo.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </PageWrapper>
  );
}
