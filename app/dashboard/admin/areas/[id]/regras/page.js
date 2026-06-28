"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Save, Settings } from "lucide-react";
import {
  Button,
  Input,
  PageHeader,
  PageWrapper,
  StatCard,
} from "@/components/ui";

const formInicial = {
  antecedenciaMinimaReserva: "",
  antecedenciaMinCancelamento: "",
  limiteReservasAtivas: "",
  horarioPermitidoInicio: "",
  horarioPermitidoFim: "",
};

function formatarHorario(data) {
  if (!data) return "";

  const valor = new Date(data);
  if (Number.isNaN(valor.getTime())) return "";

  return `${String(valor.getUTCHours()).padStart(2, "0")}:${String(valor.getUTCMinutes()).padStart(2, "0")}`;
}

function preencherFormulario(regras) {
  if (!regras) return formInicial;

  return {
    antecedenciaMinimaReserva: String(regras.antecedenciaMinimaReserva ?? ""),
    antecedenciaMinCancelamento: String(regras.antecedenciaMinCancelamento ?? ""),
    limiteReservasAtivas: String(regras.limiteReservasAtivas ?? ""),
    horarioPermitidoInicio: formatarHorario(regras.horarioPermitidoInicio),
    horarioPermitidoFim: formatarHorario(regras.horarioPermitidoFim),
  };
}

export default function RegrasAreaPage() {
  const params = useParams();
  const areaId = params.id;
  const [area, setArea] = useState(null);
  const [form, setForm] = useState(formInicial);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  useEffect(() => {
    let ativo = true;

    async function carregarRegras() {
      setCarregando(true);
      setErro("");

      try {
        const response = await fetch(`/api/areas/${areaId}/regras`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Erro ao buscar regras da area comum");
        }

        if (ativo) {
          setArea(data.area);
          setForm(preencherFormulario(data.regras));
        }
      } catch (error) {
        if (ativo) setErro(error.message);
      } finally {
        if (ativo) setCarregando(false);
      }
    }

    carregarRegras();

    return () => {
      ativo = false;
    };
  }, [areaId]);

  function atualizarCampo(event) {
    const { name, value } = event.target;
    setForm((formAtual) => ({ ...formAtual, [name]: value }));
  }

  async function salvarRegras(event) {
    event.preventDefault();
    setSalvando(true);
    setMensagem("");
    setErro("");

    try {
      const response = await fetch(`/api/areas/${areaId}/regras`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao salvar regras da area comum");
      }

      setForm(preencherFormulario(data));
      setMensagem("Regras salvas com sucesso.");
    } catch (error) {
      setErro(error.message);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <PageWrapper>
      <PageHeader title={area?.nome ? `Regras - ${area.nome}` : "Regras da Area"} />

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard label="Antecedencia Reserva" value={form.antecedenciaMinimaReserva ? `${form.antecedenciaMinimaReserva}h` : "-"} />
        <StatCard label="Antecedencia Cancelamento" value={form.antecedenciaMinCancelamento ? `${form.antecedenciaMinCancelamento}h` : "-"} />
        <StatCard label="Reservas Ativas" value={form.limiteReservasAtivas || "-"} />
      </section>

      {mensagem && <div className="rounded-[8px] border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">{mensagem}</div>}
      {erro && <div className="rounded-[8px] border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{erro}</div>}

      <form onSubmit={salvarRegras} className="table-wrapper p-5">
        <div className="mb-5 flex items-center gap-2">
          <Settings size={20} className="text-[#582688]" />
          <h2 className="section-title">Configuracao de Regras</h2>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Input
            label="Antecedencia minima para reserva (em horas)"
            name="antecedenciaMinimaReserva"
            type="number"
            value={form.antecedenciaMinimaReserva}
            onChange={atualizarCampo}
            required
            disabled={carregando}
          />
          <Input
            label="Antecedencia minima para cancelamento (em horas)"
            name="antecedenciaMinCancelamento"
            type="number"
            value={form.antecedenciaMinCancelamento}
            onChange={atualizarCampo}
            required
            disabled={carregando}
          />
          <Input
            label="Limite de reservas ativas por morador"
            name="limiteReservasAtivas"
            type="number"
            value={form.limiteReservasAtivas}
            onChange={atualizarCampo}
            required
            disabled={carregando}
          />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Input
            label="Horario permitido - inicio"
            name="horarioPermitidoInicio"
            type="time"
            value={form.horarioPermitidoInicio}
            onChange={atualizarCampo}
            required
            disabled={carregando}
          />
          <Input
            label="Horario permitido - fim"
            name="horarioPermitidoFim"
            type="time"
            value={form.horarioPermitidoFim}
            onChange={atualizarCampo}
            required
            disabled={carregando}
          />
        </div>

        <div className="mt-6 flex justify-end">
          <Button type="submit" disabled={carregando || salvando} className="justify-center">
            <Save size={18} />
            {salvando ? "Salvando..." : "Salvar Regras"}
          </Button>
        </div>
      </form>
    </PageWrapper>
  );
}
