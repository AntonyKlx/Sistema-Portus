"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { Info } from "lucide-react";
import {
  Badge,
  PageHeader,
  PageWrapper,
  SearchInput,
  Select,
  StatCard,
  Table,
} from "@/components/ui";

const usuarioMock = { name: "Pessoa B", role: "Administrador" };
const statusPendente = "Aguardando Retirada";

function formatarData(data) {
  if (!data) return "-";

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(data));
}

function formatarChegada(data) {
  if (!data) return "-";

  const dataFormatada = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(data));
  const horaFormatada = new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(data));

  return `${dataFormatada} às ${horaFormatada}`;
}

function formatarDataCurta(data) {
  if (!data) return "-";

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(data));
}

function formatarUnidade(unidade) {
  return `Bloco ${unidade.bloco} - Andar ${unidade.andar} - Apto ${unidade.numero}`;
}

function varianteStatus(status) {
  if (status === statusPendente) return "orange";
  if (status === "Retirada") return "green";
  if (status === "Cancelada") return "red";
  return "blue";
}

function Mensagem({ tipo, children }) {
  if (!children) return null;

  const classes =
    tipo === "erro"
      ? "border-red-200 bg-red-50 text-red-700"
      : "border-green-200 bg-green-50 text-green-700";

  return (
    <div className={`rounded-[8px] border px-4 py-3 text-sm font-medium ${classes}`}>
      {children}
    </div>
  );
}

function TabelaEncomendas({ encomendas, carregando, vazio }) {
  return (
    <Table columns={["Remetente", "Código", "Status", "Chegada", "Retirada", "Retirante"]}>
      {carregando ? (
        <tr className="table-row">
          <td className="table-cell" colSpan={6}>
            Carregando encomendas...
          </td>
        </tr>
      ) : encomendas.length === 0 ? (
        <tr className="table-row">
          <td className="table-cell" colSpan={6}>
            {vazio}
          </td>
        </tr>
      ) : (
        encomendas.map((encomenda) => (
          <tr key={encomenda.id} className="table-row">
            <td className="table-cell font-medium">{encomenda.remetente}</td>
            <td className="table-cell">{encomenda.codigoPacote}</td>
            <td className="table-cell">
              <Badge label={encomenda.status} variant={varianteStatus(encomenda.status)} />
            </td>
            <td className="table-cell">{formatarData(encomenda.dataHoraChegada)}</td>
            <td className="table-cell">{formatarData(encomenda.dataHoraRetirada)}</td>
            <td className="table-cell">{encomenda.nomeRetirante || "-"}</td>
          </tr>
        ))
      )}
    </Table>
  );
}

function CartaoEncomendaPendente({ encomenda }) {
  return (
    <div className="flex min-h-[108px] items-start justify-between gap-4 rounded-[13px] border border-[#E9D5FF] bg-[#F3E8FF] p-5 shadow-card">
      <div className="flex-1">
        <h3 className="text-[17px] font-semibold text-gray-700">{encomenda.remetente}</h3>
        <p className="mt-2 text-sm text-gray-500">
          Chegou em {formatarChegada(encomenda.dataHoraChegada)}
        </p>
        <div className="mt-3 flex items-start gap-1.5 text-xs font-medium text-[#6D00B5]">
          <Info size={14} className="mt-0.5 shrink-0" />
          <span>Dirija-se à portaria para retirar a sua encomenda</span>
        </div>
      </div>
      <div className="flex-shrink-0">
        <span className="inline-block rounded-full bg-[#E9D5FF] px-3 py-1 text-[10px] font-semibold uppercase text-[#6D00B5]">
          {encomenda.status}
        </span>
      </div>
    </div>
  );
}

function CartaoEncomendaRetirada({ encomenda }) {
  return (
    <div className="flex min-h-[104px] items-start justify-between gap-4 rounded-[13px] border border-[#C7C7C7] bg-white p-4 shadow-card">
      <div className="flex-1">
        <h3 className="text-[17px] font-semibold text-[#6D00B5]">
          {encomenda.remetente}
        </h3>
        <p className="mt-2 text-sm text-gray-700">
          Remetente: {encomenda.nomeRetirante || "-"}
        </p>
        <p className="mt-1 text-sm text-gray-700">
          Data: {formatarDataCurta(encomenda.dataHoraRetirada || encomenda.dataHoraChegada)}
        </p>
      </div>
      <div className="flex-shrink-0">
        <span className="inline-block rounded-full bg-gray-200 px-2.5 py-1 text-[10px] font-semibold uppercase text-gray-800">
          {encomenda.status}
        </span>
      </div>
    </div>
  );
}

export default function EncomendasPage() {
  const { data: session, status } = useSession();
  const ehMorador = session?.user?.perfil === "morador";

  const [unidades, setUnidades] = useState([]);
  const [unidadeMoradorId, setUnidadeMoradorId] = useState("");
  const [unidadeConsultaId, setUnidadeConsultaId] = useState("");
  const [pendentes, setPendentes] = useState([]);
  const [historico, setHistorico] = useState([]);
  const [consulta, setConsulta] = useState([]);
  const [buscaHistorico, setBuscaHistorico] = useState("");
  const [buscaConsulta, setBuscaConsulta] = useState("");
  const [carregandoUnidades, setCarregandoUnidades] = useState(true);
  const [carregandoMorador, setCarregandoMorador] = useState(false);
  const [carregandoConsulta, setCarregandoConsulta] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (status !== "authenticated" || ehMorador) return;

    let ativo = true;

    fetch("/api/unidades")
      .then(async (response) => {
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Erro ao buscar unidades");
        }

        if (!ativo) return;

        setUnidades(data);

        if (data.length > 0) {
          const primeiraUnidade = String(data[0].id);
          setCarregandoMorador(true);
          setCarregandoConsulta(true);
          setUnidadeMoradorId(primeiraUnidade);
          setUnidadeConsultaId(primeiraUnidade);
        }
      })
      .catch((error) => {
        if (ativo) setErro(error.message);
      })
      .finally(() => {
        if (ativo) setCarregandoUnidades(false);
      });

    return () => {
      ativo = false;
    };
  }, [status, ehMorador]);

  useEffect(() => {
    if (status !== "authenticated") return;
    if (!ehMorador && !unidadeMoradorId) return;

    let ativo = true;

    const paramsPendentes = new URLSearchParams(
      ehMorador
        ? { minhas: "true", status: statusPendente }
        : { unidadeId: unidadeMoradorId, status: statusPendente }
    );
    const paramsHistorico = new URLSearchParams(
      ehMorador ? { minhas: "true" } : { unidadeId: unidadeMoradorId }
    );

    Promise.all([
      fetch(`/api/encomendas?${paramsPendentes.toString()}`),
      fetch(`/api/encomendas?${paramsHistorico.toString()}`),
    ])
      .then(async ([pendentesResponse, historicoResponse]) => {
        const pendentesData = await pendentesResponse.json();
        const historicoData = await historicoResponse.json();

        if (!pendentesResponse.ok) {
          throw new Error(pendentesData.error || "Erro ao buscar encomendas pendentes");
        }

        if (!historicoResponse.ok) {
          throw new Error(historicoData.error || "Erro ao buscar histórico de encomendas");
        }

        if (!ativo) return;

        setPendentes(pendentesData);
        setHistorico(historicoData);
      })
      .catch((error) => {
        if (ativo) setErro(error.message);
      })
      .finally(() => {
        if (ativo) setCarregandoMorador(false);
      });

    return () => {
      ativo = false;
    };
  }, [status, ehMorador, unidadeMoradorId]);

  useEffect(() => {
    if (!unidadeConsultaId) return;

    let ativo = true;

    const params = new URLSearchParams({ unidadeId: unidadeConsultaId });

    fetch(`/api/encomendas?${params.toString()}`)
      .then(async (response) => {
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Erro ao consultar encomendas da unidade");
        }

        if (ativo) setConsulta(data);
      })
      .catch((error) => {
        if (ativo) setErro(error.message);
      })
      .finally(() => {
        if (ativo) setCarregandoConsulta(false);
      });

    return () => {
      ativo = false;
    };
  }, [unidadeConsultaId]);

  const opcoesUnidades = useMemo(() => {
    const opcoes = unidades.map((unidade) => ({
      value: String(unidade.id),
      label: formatarUnidade(unidade),
    }));

    return carregandoUnidades
      ? [{ value: "", label: "Carregando unidades..." }]
      : opcoes.length > 0
        ? opcoes
        : [{ value: "", label: "Nenhuma unidade cadastrada" }];
  }, [carregandoUnidades, unidades]);

  const historicoFiltrado = useMemo(() => {
    const termo = buscaHistorico.trim().toLowerCase();
    if (!termo) return historico;

    return historico.filter((encomenda) => {
      const texto = `${encomenda.remetente} ${encomenda.codigoPacote} ${encomenda.status}`.toLowerCase();
      return texto.includes(termo);
    });
  }, [buscaHistorico, historico]);

  const retiradasMorador = useMemo(
    () => historico.filter((encomenda) => encomenda.status === "Retirada").slice(0, 5),
    [historico],
  );

  const consultaFiltrada = useMemo(() => {
    const termo = buscaConsulta.trim().toLowerCase();
    if (!termo) return consulta;

    return consulta.filter((encomenda) => {
      const texto = `${encomenda.remetente} ${encomenda.codigoPacote} ${encomenda.status}`.toLowerCase();
      return texto.includes(termo);
    });
  }, [buscaConsulta, consulta]);

  return (
    <PageWrapper>
      {ehMorador ? (
        <header className="flex flex-col gap-1">
          <h1 className="page-title text-gray-700">Encomendas</h1>
          <p className="text-sm font-medium text-[#6D00B5]">Visualize suas encomendas.</p>
        </header>
      ) : (
        <PageHeader
          title="Encomendas"
          user={{
            name: session?.user?.name ?? usuarioMock.name,
            role: session?.user?.perfil ?? usuarioMock.role,
          }}
        />
      )}

      {ehMorador && (
        <section className="grid grid-cols-1 gap-4">
          <div className="flex min-h-[110px] flex-col items-center justify-center rounded-[13px] border border-[#C7C7C7] bg-white p-8 shadow-card">
            <p className="text-[42px] font-bold leading-none text-[#6D00B5]">
              {String(pendentes.length).padStart(2, "0")}
            </p>
            <p className="mt-1 text-sm font-medium text-gray-900">Aguardando Retirada</p>
          </div>
        </section>
      )}

      {!ehMorador && (
        <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <StatCard label="Pendentes" value={pendentes.length} />
          <StatCard label="Histórico" value={historico.length} />
          <StatCard label="Consulta atual" value={consulta.length} />
        </section>
      )}

      <Mensagem tipo="erro">{erro}</Mensagem>

      {ehMorador && (
        <section className="flex flex-col gap-4">
          <h2 className="text-[24px] font-semibold text-gray-700">Encomendas Pendentes</h2>

          <div className="space-y-3">
            {carregandoMorador ? (
              <div className="rounded-[13px] border border-gray-200 bg-white p-8 text-center text-gray-500">
                Carregando encomendas...
              </div>
            ) : pendentes.length === 0 ? (
              <div className="rounded-[13px] border border-gray-200 bg-white p-8 text-center text-gray-500">
                Você não tem encomendas pendentes.
              </div>
            ) : (
              pendentes.map((encomenda) => (
                <CartaoEncomendaPendente key={encomenda.id} encomenda={encomenda} />
              ))
            )}
          </div>
        </section>
      )}

      {!ehMorador && (
        <section className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="section-title">Encomendas da unidade</h2>
              <p className="mt-1 text-sm text-gray-500">Encomendas da unidade selecionada.</p>
            </div>
            <div className="w-full md:w-[360px]">
              <Select
                label="Unidade"
                name="unidadeMoradorId"
                value={unidadeMoradorId}
                onChange={(event) => {
                  setErro("");
                  setCarregandoMorador(true);
                  setUnidadeMoradorId(event.target.value);
                }}
                options={opcoesUnidades}
              />
            </div>
          </div>
          <TabelaEncomendas
            encomendas={pendentes}
            carregando={carregandoMorador}
            vazio="Nenhuma encomenda pendente para esta unidade."
          />
        </section>
      )}

      {ehMorador && (
        <section className="flex flex-col gap-4">
          <h2 className="text-[24px] font-semibold text-gray-950">Últimas Retiradas</h2>

          <div className="space-y-3">
            {carregandoMorador ? (
              <div className="rounded-[13px] border border-gray-200 bg-white p-8 text-center text-gray-500">
                Carregando histórico...
              </div>
            ) : retiradasMorador.length === 0 ? (
              <div className="rounded-[13px] border border-gray-200 bg-white p-8 text-center text-gray-500">
                Você não tem encomendas no histórico.
              </div>
            ) : (
              retiradasMorador.map((encomenda) => (
                <CartaoEncomendaRetirada key={encomenda.id} encomenda={encomenda} />
              ))
            )}
          </div>
        </section>
      )}

      {!ehMorador && (
        <section className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h2 className="section-title">Histórico de encomendas</h2>
            <div className="w-full md:w-80">
              <SearchInput
                placeholder="Buscar no histórico"
                value={buscaHistorico}
                onChange={(event) => setBuscaHistorico(event.target.value)}
              />
            </div>
          </div>
          <TabelaEncomendas
            encomendas={historicoFiltrado}
            carregando={carregandoMorador}
            vazio="Nenhuma encomenda encontrada no histórico."
          />
        </section>
      )}

      {!ehMorador && (
        <section className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="section-title">Consulta por unidade</h2>
              <p className="mt-1 text-sm text-gray-500">Filtro para porteiro e síndico.</p>
            </div>
            <div className="grid w-full grid-cols-1 gap-3 md:w-[680px] md:grid-cols-[1fr_320px]">
              <Select
                label="Unidade"
                name="unidadeConsultaId"
                value={unidadeConsultaId}
                onChange={(event) => {
                  setErro("");
                  setCarregandoConsulta(true);
                  setUnidadeConsultaId(event.target.value);
                }}
                options={opcoesUnidades}
              />
              <SearchInput
                placeholder="Buscar remetente, código ou status"
                value={buscaConsulta}
                onChange={(event) => setBuscaConsulta(event.target.value)}
              />
            </div>
          </div>

          <TabelaEncomendas
            encomendas={consultaFiltrada}
            carregando={carregandoConsulta}
            vazio="Nenhuma encomenda encontrada para esta unidade."
          />
        </section>
      )}
    </PageWrapper>
  );
}
