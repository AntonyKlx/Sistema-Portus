"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { Logs, PackagePlus, Users, Building2 } from "lucide-react";
import { Badge, PageHeader, PageWrapper, StatCard, Table } from "@/components/ui";

const perfisDashboard = ["porteiro", "sindico", "administrador", "adminMaster"];
const perfisGestao = ["sindico", "administrador", "adminMaster"];
const perfisAdminMaster = ["adminMaster"];

const acoesRapidas = [
  {
    titulo: "Registrar Encomenda",
    descricao: "Entrada de novos volumes",
    href: "/porteiro/encomendas",
    icon: PackagePlus,
    perfis: perfisDashboard,
  },
  {
    titulo: "Registrar Morador",
    descricao: "Entrada de novos moradores",
    href: "/porteiro/moradores",
    icon: Users,
    perfis: perfisGestao,
  },
  {
    titulo: "Registrar Apartamentos",
    descricao: "Cadastro de unidades",
    href: "/porteiro/apartamentos",
    icon: Building2,
    perfis: perfisGestao,
  },
  {
    titulo: "Analisar Logs",
    descricao: "Historico de acoes",
    href: "/porteiro/logs",
    icon: Logs,
    perfis: perfisAdminMaster,
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
  const [cards, setCards] = useState({
    encomendasPendentes: 0,
    reservasPendentes: 0,
    moradoresAtivos: 0,
  });
  const [encomendasRecentes, setEncomendasRecentes] = useState([]);
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

      try {
        const response = await fetch("/api/porteiro/dashboard");
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Erro ao carregar dashboard");
        }

        if (!ativo) return;

        setCards(data.cards || {
          encomendasPendentes: 0,
          reservasPendentes: 0,
          moradoresAtivos: 0,
        });
        setEncomendasRecentes(Array.isArray(data.encomendasRecentes) ? data.encomendasRecentes : []);
      } catch (error) {
        if (ativo) setErro(error.message);
      } finally {
        if (ativo) setCarregando(false);
      }
    }

    carregarDashboard();

    return () => {
      ativo = false;
    };
  }, []);

  const acoesVisiveis = useMemo(
    () => acoesRapidas.filter((acao) => !acao.perfis || acao.perfis.includes(session?.user?.perfil)),
    [session?.user?.perfil],
  );

  return (
    <PageWrapper>
      <PageHeader title="Dashboard" user={usuario} />

      <section>
        <h2 className="text-[30px] font-bold leading-9 text-[#582688]">
          Bem vindo, {usuario.name}
        </h2>
        <p className="mt-3 text-[17px] text-gray-500">
          Gerencie suas solicitações e encomendas do dia a dia.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard label="Encomendas Pendentes" value={carregando ? "..." : cards.encomendasPendentes} />
        <StatCard label="Reservas Pendentes" value={carregando ? "..." : cards.reservasPendentes} />
        <StatCard label="Moradores Ativos" value={carregando ? "..." : cards.moradoresAtivos} />
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
        <h2 className="mb-4 text-[26px] font-bold leading-8 text-[#582688]">Ações rápidas</h2>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {acoesVisiveis.map(({ titulo, descricao, href, icon: Icon }) => (
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
