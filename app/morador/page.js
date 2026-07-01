"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react"; //
import { Package, CalendarDays } from "lucide-react";

const statusPendente = "Aguardando Retirada";

function primeiroNome(session) {
  const nome = session?.user?.name || session?.user?.nome || "Morador";
  return nome.split(" ")[0];
}

function formatarChegada(data) {
  if (!data) return "Sem chegada registrada";

  const valor = new Date(data);
  const hoje = new Date();
  const mesmaData =
    valor.getFullYear() === hoje.getFullYear() &&
    valor.getMonth() === hoje.getMonth() &&
    valor.getDate() === hoje.getDate();

  const hora = new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(valor);

  if (mesmaData) return `Chegada: Hoje, ${hora}`;

  const dataFormatada = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
  }).format(valor);

  return `Chegada: ${dataFormatada}, ${hora}`;
}

function formatarReserva(data) {
  if (!data) return "-";

  const valor = new Date(data);
  const dataFormatada = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(valor);
  const hora = new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(valor);

  return `${dataFormatada}, ${hora}`;
}

function Mensagem({ tipo, children }) {
  if (!children) return null;

  const classes = tipo === "erro"
    ? "border-red-200 bg-red-50 text-red-700"
    : "border-green-200 bg-green-50 text-green-700";

  return <div className={`rounded-[8px] border px-4 py-3 text-sm font-medium ${classes}`}>{children}</div>;
}

export default function PainelMoradorPage() {
  const { data: session, status } = useSession();
  const [encomendasPendentes, setEncomendasPendentes] = useState([]);
  const [reservas, setReservas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (status !== "authenticated") return;

    let ativo = true;

    async function carregarPainel() {
      setCarregando(true);
      setErro("");

      try {
        const [resEncomendas, resReservas] = await Promise.all([
          fetch(`/api/morador/encomendas?minhas=true&status=${statusPendente}`),
          fetch("/api/porteiro/reservas?minhas=true"),
        ]);

        const dataEncomendas = await resEncomendas.json();
        const dataReservas = await resReservas.json();

        if (!resEncomendas.ok) {
          throw new Error(dataEncomendas.error || "Erro ao buscar encomendas.");
        }

        if (!resReservas.ok) {
          throw new Error(dataReservas.error || "Erro ao buscar reservas.");
        }

        if (ativo) {
          setEncomendasPendentes(Array.isArray(dataEncomendas) ? dataEncomendas : []);
          setReservas(Array.isArray(dataReservas) ? dataReservas : []);
        }
      } catch (error) {
        if (ativo) setErro(error.message || "Não foi possivel carregar o painel.");
      } finally {
        if (ativo) setCarregando(false);
      }
    }

    carregarPainel();

    return () => {
      ativo = false;
    };
  }, [status]);

  const reservasConfirmadas = useMemo(() => {
    return reservas
      .filter((reserva) => reserva.status === "Aprovada")
      .sort((a, b) => new Date(a.dataHora).getTime() - new Date(b.dataHora).getTime())
      .slice(0, 3);
  }, [reservas]);

  const ultimaEncomenda = encomendasPendentes[0];

  return (
    <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-6 px-6 py-5 sm:px-8">
      <header>
        <h1 className="text-[22px] font-bold leading-7 text-gray-800">Olá, {primeiroNome(session)}!</h1>
        <p className="mt-1 text-sm font-medium text-[#582688]">Aqui está as informações gerais de hoje.</p>
      </header>

      {erro && <Mensagem tipo="erro">{erro}</Mensagem>}

      <section className="relative overflow-hidden rounded-[13px] bg-gradient-to-r from-[#5B21B6] to-[#2B0D46] p-5 text-white shadow-card">
        <div className="relative z-10">
          <p className="text-[24px] font-bold leading-6">
            {carregando ? "..." : encomendasPendentes.length} Encomenda{encomendasPendentes.length === 1 ? "" : "s"}
          </p>
          <p className="text-[24px] font-bold leading-6">Pendente{encomendasPendentes.length === 1 ? "" : "s"}</p>
          <p className="mt-4 text-sm font-medium text-white/85">
            {carregando ? "Carregando..." : ultimaEncomenda ? formatarChegada(ultimaEncomenda.dataHoraChegada) : "Nenhuma encomenda pendente"}
          </p>
        </div> {/* */}
        <Package size={96} className="absolute left-[200px] top-7 text-[#8d48d1]" />
      </section>

      <section>
        <h2 className="mb-3 text-[20px] font-bold text-gray-800">Reservas</h2>

        <div className="rounded-[13px] bg-[#F3E8FF] p-4 shadow-card">
          {carregando ? (
            <p className="text-sm text-gray-500">Carregando reservas...</p>
          ) : reservasConfirmadas.length === 0 ? (
            <p className="text-sm text-gray-500">Você não possui reservas confirmadas.</p>
          ) : (
            reservasConfirmadas.map((reserva, index) => (
              <article
                key={reserva.id}
                className={`py-1.5 ${index > 0 ? "border-t border-[#E0CCF4] pt-3" : ""}`}
              >
                <h3 className="text-[17px] font-bold text-[#582688]">{reserva.areaComum?.nome || "Area comum"}</h3>
                <div className="mt-1 flex items-center gap-2 text-sm text-gray-700">
                  <CalendarDays size={15} />
                  <span>{formatarReserva(reserva.dataHora)}</span>
                </div>
                <span className="mt-2 inline-flex rounded-full border border-green-500 bg-white px-2.5 py-0.5 text-xs font-medium text-green-600">
                  Confirmado
                </span>
              </article>
            ))
          )}
        </div>

        <Link
          href="/morador/reservas/nova"
          className="mt-4 flex h-11 items-center justify-center rounded-[13px] border border-[#582688] bg-white text-sm font-bold text-[#582688] transition hover:bg-[#F3E8FF]"
        >
          Solicitar Nova Reserva
        </Link>
      </section>
    </div>
  );
}
