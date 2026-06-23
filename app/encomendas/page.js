"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
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
      <PageHeader
        title="Encomendas"
        user={{
          name: session?.user?.name ?? usuarioMock.name,
          role: session?.user?.perfil ?? usuarioMock.role,
        }}
      />

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard label="Pendentes" value={pendentes.length} />
        <StatCard label="Histórico" value={historico.length} />
        {!ehMorador && <StatCard label="Consulta atual" value={consulta.length} />}
      </section>

      <Mensagem tipo="erro">{erro}</Mensagem>

      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="section-title">
              {ehMorador ? "Minhas encomendas" : "Encomendas da unidade"}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {ehMorador
                ? "Lista de encomendas da sua unidade."
                : "Encomendas da unidade selecionada."}
            </p>
          </div>
          {!ehMorador && (
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
          )}
        </div>

        <TabelaEncomendas
          encomendas={pendentes}
          carregando={carregandoMorador}
          vazio={ehMorador ? "Você não tem encomendas pendentes." : "Nenhuma encomenda pendente para esta unidade."}
        />
      </section>

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
          vazio={ehMorador ? "Você não tem encomendas no histórico." : "Nenhuma encomenda encontrada no histórico."}
        />
      </section>

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
