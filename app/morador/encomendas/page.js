"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { Info } from "lucide-react";
import {
  Badge,
  PageWrapper,
} from "@/components/ui";

const statusPendente = "Aguardando Retirada";

// Funções auxiliares de formatação
function formatarChegada(data) {
  if (!data) return "-";
  const dataObj = new Date(data);
  const dataFormatada = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
  }).format(dataObj);
  const horaFormatada = new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit", minute: "2-digit", hour12: false,
  }).format(dataObj);

  return `${dataFormatada} às ${horaFormatada}`;
}

function formatarDataCurta(data) {
  if (!data) return "-";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
  }).format(new Date(data));
}

// Componentes de Mensagem e Cartões
function Mensagem({ tipo, children }) {
  if (!children) return null;
  const classes = tipo === "erro" ? "border-red-200 bg-red-50 text-red-700" : "border-green-200 bg-green-50 text-green-700";
  return <div className={`rounded-[8px] border px-4 py-3 text-sm font-medium ${classes}`}>{children}</div>;
}

function CartaoEncomendaPendente({ encomenda }) {
  return (
    <div className="flex min-h-[108px] items-start justify-between rounded-[13px] border border-[#E9D5FF] bg-[#F3E8FF] p-4 shadow-card">
      <div className="flex-1">
        <h3 className="text-[17px] font-semibold text-gray-700">{encomenda.remetente}</h3>
        <p className="mt-2 text-sm text-gray-500">Chegou em {formatarChegada(encomenda.dataHoraChegada)}</p>
        <div className="mt-3 flex items-start gap-1.5 text-xs font-medium text-[#6D00B5]">
          <Info size={14} className="mt-0.5 shrink-0" />
          <span>Dirija-se à portaria para retirar a sua encomenda</span>
        </div>
      </div>
      <div className="flex-shrink-0">
        <Badge label="Pendente" variant="orange" />
      </div>
    </div>
  );
}

function CartaoEncomendaRetirada({ encomenda }) {
  return (
    <div className="flex min-h-[104px] items-start justify-between gap-4 rounded-[13px] border border-[#C7C7C7] bg-white p-4 shadow-card">
      <div className="flex-1">
        <h3 className="text-[17px] font-semibold text-[#6D00B5]">{encomenda.remetente}</h3>
        <p className="mt-2 text-sm text-gray-700">Retirante: {encomenda.nomeRetirante || "Morador"}</p>
        <p className="mt-1 text-sm text-gray-500 text-[12px]">Data: {formatarDataCurta(encomenda.dataHoraRetirada)}</p>
      </div>
      <div className="flex-shrink-0">
        <Badge label="Retirada" variant="green" />
      </div>
    </div>
  );
}

export default function EncomendasMoradorPage() {
  const { status } = useSession();
  const [pendentes, setPendentes] = useState([]);
  const [historico, setHistorico] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (status !== "authenticated") return;

    let ativo = true;

    // Busca apenas as encomendas do morador logado
    const fetchDados = async () => {
      try {
        const [resPendentes, resHistorico] = await Promise.all([
          fetch(`/api/morador/encomendas?minhas=true&status=${statusPendente}`),
          fetch(`/api/morador/encomendas?minhas=true`)
        ]);

        const dataPendentes = await resPendentes.json();
        const dataHistorico = await resHistorico.json();

        if (!resPendentes.ok) {
          throw new Error(dataPendentes.error || "Erro ao buscar encomendas pendentes.");
        }

        if (!resHistorico.ok) {
          throw new Error(dataHistorico.error || "Erro ao buscar histÃ³rico de encomendas.");
        }

        if (ativo) {
          setPendentes(dataPendentes);
          setHistorico(dataHistorico);
        }
      } catch (err) {
        if (ativo) setErro("Não foi possível carregar suas encomendas.");
      } finally {
        if (ativo) setCarregando(false);
      }
    };

    fetchDados();
    return () => { ativo = false; };
  }, [status]);

  // Filtra apenas as que já foram retiradas para a seção de histórico
  const ultimasRetiradas = useMemo(() => 
    historico.filter(e => e.status === "Retirada").slice(0, 5), 
  [historico]);

  return (
    <PageWrapper>
      {/* Header específico para Morador */}
      <header className="flex flex-col gap-1 mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Minhas Encomendas</h1>
        <p className="text-sm font-medium text-[#6D00B5]">Acompanhe seus pacotes recebidos.</p>
      </header>

      {/* Card de Resumo de Pendentes (Grande) */}
      <section className="mb-8">
        <div className="flex min-h-[110px] flex-col items-center justify-center rounded-[13px] border border-[#C7C7C7] bg-white p-6 shadow-card">
          <p className="text-[48px] font-bold leading-none text-[#6D00B5]">
            {String(pendentes.length).padStart(2, "0")}
          </p>
          <p className="mt-2 text-sm font-semibold text-gray-600 uppercase tracking-wide">
            Aguardando Retirada
          </p>
        </div>
      </section>

      <Mensagem tipo="erro">{erro}</Mensagem>

      {/* Lista de Encomendas Pendentes */}
      <section className="flex flex-col gap-4 mb-10">
        <h2 className="text-[20px] font-bold text-gray-700">Encomendas Pendentes</h2>
        <div className="space-y-3">
          {carregando ? (
            <div className="p-8 text-center text-gray-400 italic">Carregando...</div>
          ) : pendentes.length === 0 ? (
            <div className="rounded-[13px] border border-dashed border-gray-300 bg-gray-50 p-10 text-center text-gray-500">
              Você não tem encomendas pendentes na portaria.
            </div>
          ) : (
            pendentes.map((enc) => <CartaoEncomendaPendente key={enc.id} encomenda={enc} />)
          )}
        </div>
      </section>

      {/* Lista de Últimas Retiradas */}
      <section className="flex flex-col gap-4 pb-10">
        <h2 className="text-[20px] font-bold text-gray-800">Últimas Retiradas</h2>
        <div className="space-y-3">
          {carregando ? (
             <div className="p-8 text-center text-gray-400 italic">Carregando...</div>
          ) : ultimasRetiradas.length === 0 ? (
            <div className="rounded-[13px] border border-gray-200 bg-white p-8 text-center text-gray-400">
              Nenhuma retirada registrada recentemente.
            </div>
          ) : (
            ultimasRetiradas.map((enc) => <CartaoEncomendaRetirada key={enc.id} encomenda={enc} />)
          )}
        </div>
      </section>
    </PageWrapper>
  );
}
