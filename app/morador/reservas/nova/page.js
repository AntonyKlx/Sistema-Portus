'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, CalendarDays, CheckCircle2, Clock3, Plus } from 'lucide-react'
import { PageWrapper, Button, Select } from "@/components/ui"

function hojeInput() {
  return new Date().toISOString().split('T')[0]
}

function Mensagem({ tipo, children }) {
  if (!children) return null

  const classes = tipo === 'erro'
    ? 'border-red-200 bg-red-50 text-red-700'
    : 'border-green-200 bg-green-50 text-green-700'

  return (
    <div className={`rounded-[8px] border px-4 py-3 text-sm font-medium ${classes}`}>
      {children}
    </div>
  )
}

export default function NovaReservaPage() {
  const router = useRouter()

  const [areas, setAreas] = useState([])
  const [formData, setFormData] = useState({ areaId: '', data: '' })
  const [horarios, setHorarios] = useState([])
  const [horarioSelecionado, setHorarioSelecionado] = useState('')
  const [carregandoAreas, setCarregandoAreas] = useState(true)
  const [carregandoHorarios, setCarregandoHorarios] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [mensagem, setMensagem] = useState(null)

  useEffect(() => {
    let ativo = true

    fetch('/api/areas')
      .then((res) => res.json())
      .then((data) => {
        if (ativo) setAreas(Array.isArray(data) ? data : [])
      })
      .catch(() => {
        if (ativo) setMensagem({ tipo: 'erro', texto: 'Erro ao buscar áreas disponíveis.' })
      })
      .finally(() => {
        if (ativo) setCarregandoAreas(false)
      })

    return () => {
      ativo = false
    }
  }, [])

  useEffect(() => {
    if (!formData.areaId || !formData.data) {
      const timer = window.setTimeout(() => {
        setHorarios([])
        setHorarioSelecionado('')
      }, 0)

      return () => window.clearTimeout(timer)
    }

    let ativo = true
    const timer = window.setTimeout(() => {
      setCarregandoHorarios(true)
      setHorarioSelecionado('')
    }, 0)

    fetch(`/api/areas/${formData.areaId}/disponibilidade?data=${formData.data}`)
      .then((res) => res.json())
      .then((data) => {
        if (ativo) setHorarios(data.horariosDisponiveis || [])
      })
      .catch(() => {
        if (ativo) {
          setHorarios([])
          setMensagem({ tipo: 'erro', texto: 'Erro ao buscar horários disponíveis.' })
        }
      })
      .finally(() => {
        if (ativo) setCarregandoHorarios(false)
      })

    return () => {
      ativo = false
      window.clearTimeout(timer)
    }
  }, [formData.areaId, formData.data])

  const opcoesAreas = useMemo(() => {
    const opcoes = areas.map((area) => ({ value: String(area.id), label: area.nome }))
    if (carregandoAreas) return [{ value: '', label: 'Carregando áreas...' }]
    return [{ value: '', label: 'Selecione uma área' }, ...opcoes]
  }, [areas, carregandoAreas])

  function voltar() {
    if (window.history.length > 1) {
      router.back()
      return
    }

    router.push('/morador/reservas')
  }

  async function confirmarReserva() {
    if (!formData.areaId || !formData.data || !horarioSelecionado) return

    setEnviando(true)
    setMensagem(null)

    try {
      const dataHora = `${formData.data}T${horarioSelecionado}:00`

      const resposta = await fetch('/api/reservas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          areaComumId: Number(formData.areaId),
          dataHora,
        }),
      })

      const dados = await resposta.json()

      if (!resposta.ok) {
        setMensagem({ tipo: 'erro', texto: dados.error || 'Erro ao solicitar reserva.' })
        return
      }

      setMensagem({ tipo: 'sucesso', texto: 'Reserva solicitada. Aguarde a aprovação.' })
      setHorarioSelecionado('')
    } catch (err) {
      setMensagem({ tipo: 'erro', texto: 'Erro ao enviar a solicitação.' })
    } finally {
      setEnviando(false)
    }
  }

  return (
    <PageWrapper>
      <div>
        <div>
          <button
            type="button"
            onClick={voltar}
            className="mb-3 inline-flex items-center gap-2 rounded-[8px] border border-transparent px-3 py-2 text-sm font-semibold text-[#582688] transition-colors hover:border-[#DCCAF0] hover:bg-[#F3E8FF] hover:text-[#4C1D79] focus:outline-none focus:ring-2 focus:ring-[#582688]/20"
          >
            <ArrowLeft size={17} />
            Voltar
          </button>
          <h1 className="text-[24px] font-bold leading-8 text-gray-950">Solicitar Nova Reserva</h1>
          <p className="mt-1 text-sm text-[#582688]">Escolha a área, a data e um horário disponível.</p>
        </div>
      </div>

      {mensagem && <Mensagem tipo={mensagem.tipo}>{mensagem.texto}</Mensagem>}

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[380px_1fr]">
        <article className="table-wrapper h-fit p-5">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-[8px] bg-[#F3E8FF] text-[#582688]">
              <CalendarDays size={22} />
            </div>
            <div>
              <h2 className="section-title">Dados da reserva</h2>
              <p className="text-sm text-gray-500">Informe quando deseja usar o espaço.</p>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <Select
              label="Área comum"
              value={formData.areaId}
              options={opcoesAreas}
              onChange={(event) => setFormData((form) => ({ ...form, areaId: event.target.value }))}
              disabled={carregandoAreas}
            />

            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-gray-700">Data da reserva</label>
              <div className="input-icon-wrapper">
                <span className="input-icon">
                  <CalendarDays size={16} />
                </span>
                <input
                  type="date"
                  value={formData.data}
                  onChange={(event) => setFormData((form) => ({ ...form, data: event.target.value }))}
                  min={hojeInput()}
                  className="input input-with-icon"
                />
              </div>
            </div>
          </div>
        </article>

        <article className="table-wrapper p-5">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="section-title">Horários disponíveis</h2>
              <p className="text-sm text-gray-500">Selecione um horário para enviar a solicitação.</p>
            </div>
            <Clock3 className="text-[#582688]" size={22} />
          </div>

          {!formData.areaId || !formData.data ? (
            <div className="rounded-[8px] border border-dashed border-[#C7C7C7] p-6 text-center text-sm text-gray-500">
              Escolha uma área e uma data para visualizar os horários.
            </div>
          ) : carregandoHorarios ? (
            <div className="rounded-[8px] border border-[#E5E7EB] p-6 text-center text-sm text-gray-500">
              Buscando horários disponíveis...
            </div>
          ) : horarios.length === 0 ? (
            <div className="rounded-[8px] border border-[#E5E7EB] p-6 text-center text-sm text-gray-500">
              Nenhum horário disponível para esta data.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {horarios.map((hora) => {
                const selecionado = horarioSelecionado === hora

                return (
                  <button
                    key={hora}
                    type="button"
                    onClick={() => setHorarioSelecionado(hora)}
                    className={`flex h-11 items-center justify-center rounded-[8px] border text-sm font-semibold transition-colors ${
                      selecionado
                        ? 'border-[#582688] bg-[#582688] text-white'
                        : 'border-[#C7C7C7] bg-white text-gray-700 hover:border-[#582688] hover:bg-[#F3E8FF] hover:text-[#582688]'
                    }`}
                  >
                    {hora}
                  </button>
                )
              })}
            </div>
          )}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <CheckCircle2 size={16} className="text-green-600" />
              {horarioSelecionado ? `Horário selecionado: ${horarioSelecionado}` : 'Nenhum horário selecionado'}
            </div>

            <Button
              disabled={!horarioSelecionado || enviando}
              onClick={confirmarReserva}
              className="justify-center whitespace-nowrap"
            >
              <Plus size={17} />
              {enviando ? 'Enviando...' : 'Solicitar reserva'}
            </Button>
          </div>
        </article>
      </section>
    </PageWrapper>
  )
}
