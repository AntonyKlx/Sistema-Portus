"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { Logs, PackagePlus, Users, Building2 } from "lucide-react";
import { Badge, PageHeader, PageWrapper, StatCard, Table } from "@/components/ui";

const acoesRapidas = [
  {
    titulo: "Registrar Encomenda",
    descricao: "Entrada de novos volumes",
    href: "/porteiro/encomendas",
    icon: PackagePlus,
  },
  {
    titulo: "Registrar Morador",
    descricao: "Entrada de novos moradores",
    href: "/porteiro/moradores",
    icon: Users,
  },
  {
    titulo: "Registrar Apartamentos",
    descricao: "Cadastro de unidades",
    href: "/porteiro/apartamentos",
    icon: Building2,
  },
  {
    titulo: "Analisar Logs",
    descricao: "Historico de acoes",
    href: "/porteiro/logs",
    icon: Logs,
  },
];

function nomeExibicao(session) {
  return session?.user?.name || "Usuario Teste";
}

function roleExibicao(session) {
  if (!session?.user?.perfil) return "Admin";
  return session.user.perfil.charAt(0).toUpperCase() + session.user.perfil.slice(1);
}

function formatarData(data) {
  if (!data) return "-";

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(data));
}

function statusEncomenda(status) {
  return status === "Retirada" ? "Entregue" : "Pendente";
}

export default function PorteiroDashboard() {
  const { data: session } = useSession();
  const [encomendas, setEncomendas] = useState([]);
  const [reservasPendentes, setReservasPendentes] = useState([]);
  const [moradores, setMoradores] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const usuario = {
    name: nomeExibicao(session),
    role: roleExibicao(session),
  };

  useEffect(() => {
    let ativo = true;

    async function carregarDashboard() {
      setCarregando(true);
      setErro("");

      const [resultadoEncomendas, resultadoReservas, resultadoMoradores] = await Promise.allSettled([
        fetch("/api/porteiro/encomendas").then(async (response) => {
          const data = await response.json();
          if (!response.ok) throw new Error(data.message || data.error || "Erro ao buscar encomendas");
          return Array.isArray(data) ? data : [];
        }),
        fetch("/api/porteiro/reservas?status=Pendente").then(async (response) => {
          const data = await response.json();
          if (!response.ok) throw new Error(data.error || "Erro ao buscar reservas");
          return Array.isArray(data) ? data : [];
        }),
        fetch("/api/porteiro/moradores").then(async (response) => {
          const data = await response.json();
          if (!response.ok) throw new Error(data.error || "Erro ao buscar moradores");
          return Array.isArray(data) ? data : [];
        }),
      ]);

      if (!ativo) return;

      if (resultadoEncomendas.status === "fulfilled") setEncomendas(resultadoEncomendas.value);
      if (resultadoReservas.status === "fulfilled") setReservasPendentes(resultadoReservas.value);
      if (resultadoMoradores.status === "fulfilled") setMoradores(resultadoMoradores.value);

      const falhas = [resultadoEncomendas, resultadoReservas, resultadoMoradores]
        .filter((resultado) => resultado.status === "rejected")
        .map((resultado) => resultado.reason?.message)
        .filter(Boolean);

      if (falhas.length > 0) setErro(falhas.join(" | "));
      setCarregando(false);
    }

    carregarDashboard();

    return () => {
      ativo = false;
    };
  }, []);

  const encomendasPendentes = useMemo(
    () => encomendas.filter((encomenda) => encomenda.status === "Aguardando Retirada").length,
    [encomendas],
  );

  const moradoresAtivos = useMemo(
    () => moradores.filter((morador) => morador.usuario?.ativo !== false).length,
    [moradores],
  );

  const encomendasRecentes = useMemo(
    () => encomendas.slice(0, 3),
    [encomendas],
  );

  return (
    <PageWrapper>
      <PageHeader title="Dashboard" user={usuario} />

      <section>
        <h2 className="text-[30px] font-bold leading-9 text-[#582688]">
          Bem vindo, {usuario.name}
        </h2>
        <p className="mt-3 text-[17px] text-gray-500">
          Gerencie suas solicitacoes e encomendas do dia a dia.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard label="Encomendas Pendentes" value={carregando ? "..." : encomendasPendentes} />
        <StatCard label="Reservas Pendentes" value={carregando ? "..." : reservasPendentes.length} />
        <StatCard label="Moradores Ativos" value={carregando ? "..." : moradoresAtivos} />
      </section>

      {erro && (
        <div className="rounded-[8px] border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {erro}
        </div>
      )}

      <Table title="Encomendas Recentes" columns={["Apartamento", "Morador", "Data", "Status"]}>
        {carregando ? (
          <tr className="table-row">
            <td className="table-cell text-gray-500" colSpan={4}>Carregando encomendas...</td>
          </tr>
        ) : encomendasRecentes.length === 0 ? (
          <tr className="table-row">
            <td className="table-cell text-gray-500" colSpan={4}>Nenhuma encomenda registrada.</td>
          </tr>
        ) : encomendasRecentes.map((encomenda) => (
          <tr key={encomenda.id} className="table-row">
            <td className="table-cell font-medium">{encomenda.apartamento}</td>
            <td className="table-cell">{encomenda.morador}</td>
            <td className="table-cell">{formatarData(encomenda.data)}</td>
            <td className="table-cell">
              <Badge
                label={statusEncomenda(encomenda.status)}
                variant={encomenda.status === "Retirada" ? "green" : "orange"}
              />
            </td>
          </tr>
        ))}
      </Table>

      <section>
        <h2 className="mb-4 text-[26px] font-bold leading-8 text-[#582688]">Acoes rapidas</h2>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {acoesRapidas.map(({ titulo, descricao, href, icon: Icon }) => (
            <Link
              key={titulo}
              href={href}
              className="flex min-h-[190px] flex-col items-center justify-center rounded-[13px] border border-[#C7C7C7] bg-white p-6 text-center shadow-card transition hover:-translate-y-0.5 hover:shadow-card-hover"
            >
              <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-full bg-[#F3E8FF] text-[#7C3AED]">
                <Icon size={21} />
              </div>
              <h3 className="max-w-[170px] text-[22px] font-bold leading-6 text-[#582688]">{titulo}</h3>
              <p className="mt-3 max-w-[150px] text-xs leading-4 text-gray-500">{descricao}</p>
            </Link>
          ))}
        </div>
      </section>
    </PageWrapper>
  );
}
