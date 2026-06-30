'use client'

import Link from "next/link"
import { useEffect, useMemo, useState } from 'react'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, Plus, ArrowRight } from 'lucide-react'
import { PageWrapper, Button } from "@/components/ui"

const TIME_ZONE = "America/Sao_Paulo"
const prioridadeStatus = {
  Aprovada: 0,
  Pendente: 1,
  Reprovada: 2,
  Cancelada: 3,
}

function tituloMes(data) {
  return new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(data)
}

function chaveData(data) {
  const partes = new Intl.DateTimeFormat("pt-BR", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(data))

  const ano = partes.find((parte) => parte.type === "year")?.value
  const mes = partes.find((parte) => parte.type === "month")?.value
  const dia = partes.find((parte) => parte.type === "day")?.value

  return `${ano}-${mes}-${dia}`
}

function formatarData(data) {
  if (!data) return "-"
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(new Date(data))
}

function formatarHora(data) {
  if (!data) return "-"
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(data))
}

function podeCancelar(status) {
  return ["Pendente", "Aprovada"].includes(status)
}

function renderBadge(status) {
  const estilos = {
    Aprovada: "border-green-500 text-green-600",
    Pendente: "border-yellow-400 text-yellow-500",
    Reprovada: "border-red-400 text-red-500",
    Cancelada: "border-gray-300 text-gray-500",
  }

  return (
    <span className={`rounded-full border bg-white px-3 py-0.5 text-xs font-medium ${estilos[status] || "border-gray-300 text-gray-500"}`}>
      {status || "Indefinido"}
    </span>
  )
}

function Mensagem({ tipo, children }) {
  if (!children) return null

  const classes = tipo === "erro"
    ? "border-red-200 bg-red-50 text-red-700"
    : "border-green-200 bg-green-50 text-green-700"

  return <div className={`rounded-[8px] border px-4 py-3 text-sm font-medium ${classes}`}>{children}</div>
}

export default function ReservasMoradorPage() {
  const [mesExibido, setMesExibido] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1))
  const [minhasReservas, setMinhasReservas] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState("")
  const [mensagem, setMensagem] = useState("")
  const [cancelandoId, setCancelandoId] = useState(null)

  async function carregarReservas() {
    setCarregando(true)
    setErro("")

    try {
      const response = await fetch("/api/porteiro/reservas?minhas=true")
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erro ao buscar suas reservas.")
      }

      setMinhasReservas(Array.isArray(data) ? data : [])
    } catch (error) {
      setErro(error.message)
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregarReservas()
  }, [])

  const diasCalendario = useMemo(() => {
    const primeiroDia = new Date(mesExibido.getFullYear(), mesExibido.getMonth(), 1)
    const ultimoDia = new Date(mesExibido.getFullYear(), mesExibido.getMonth() + 1, 0)
    const inicio = (primeiroDia.getDay() + 6) % 7
    const totalCelulas = Math.ceil((inicio + ultimoDia.getDate()) / 7) * 7

    return Array.from({ length: totalCelulas }, (_, indice) => {
      const dia = indice - inicio + 1
      return dia > 0 && dia <= ultimoDia.getDate()
        ? new Date(mesExibido.getFullYear(), mesExibido.getMonth(), dia)
        : null
    })
  }, [mesExibido])

  const reservasVisiveis = useMemo(() => {
    return [...minhasReservas]
      .sort((a, b) => {
        const prioridadeA = prioridadeStatus[a.status] ?? 99
        const prioridadeB = prioridadeStatus[b.status] ?? 99

        if (prioridadeA !== prioridadeB) return prioridadeA - prioridadeB

        return new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime()
      })
      .slice(0, 6)
  }, [minhasReservas])

  const diasReservados = useMemo(
    () => new Set(minhasReservas.filter((reserva) => reserva.status === "Aprovada").map((reserva) => chaveData(reserva.dataHora))),
    [minhasReservas],
  )

  async function cancelarReserva(id) {
    if (!window.confirm("Deseja realmente cancelar esta reserva?")) return

    setCancelandoId(id)
    setMensagem("")
    setErro("")

    try {
      const response = await fetch(`/api/porteiro/reservas/${id}`, { method: "DELETE" })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erro ao cancelar reserva.")
      }

      setMensagem("Reserva cancelada com sucesso.")
      await carregarReservas()
    } catch (error) {
      setErro(error.message)
    } finally {
      setCancelandoId(null)
    }
  }

  return (
    <PageWrapper>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Reservas</h1>
        <p className="text-[#582688] text-sm mt-1">Visualize suas reservas.</p>
      </div>

      {mensagem && <Mensagem tipo="sucesso">{mensagem}</Mensagem>}
      {erro && <Mensagem tipo="erro">{erro}</Mensagem>}

      <section className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Calendario de Reservas</h2>

        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-[#582688] font-bold text-lg capitalize">{tituloMes(mesExibido)}</h3>
            <div className="flex text-[#582688] gap-3">
              <ChevronLeft
                size={20}
                className="cursor-pointer"
                onClick={() => setMesExibido((mes) => new Date(mes.getFullYear(), mes.getMonth() - 1, 1))}
              />
              <ChevronRight
                size={20}
                className="cursor-pointer"
                onClick={() => setMesExibido((mes) => new Date(mes.getFullYear(), mes.getMonth() + 1, 1))}
              />
            </div>
          </div>

          <div className="grid grid-cols-7 gap-y-4 text-center text-sm text-gray-600">
            {diasCalendario.map((dia, indice) => {
              const reservado = dia && diasReservados.has(chaveData(dia))

              return (
                <div key={`${dia?.toISOString() || "vazio"}-${indice}`} className="flex justify-center relative">
                  {dia ? (
                    <span className={`relative w-8 h-8 flex items-center justify-center ${reservado ? 'text-[#582688] font-semibold' : ''}`}>
                      {dia.getDate()}
                      {reservado && (
                        <span className="absolute bottom-0 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-[#582688]"></span>
                      )}
                    </span>
                  ) : (
                    <span className="w-8 h-8 flex items-center justify-center"></span>
                  )}
                </div>
              )
            })}
          </div>

          <div className="mt-6 flex items-center gap-2 text-xs text-gray-500 border-t border-gray-100 pt-4">
            <span className="w-1.5 h-1.5 bg-[#582688] rounded-full"></span>
            Reserva Aprovada
          </div>
        </div>

        <div className="flex justify-end mt-3">
          <button className="text-[#582688] text-sm font-semibold flex items-center gap-1 hover:underline">
            Ver historico Completo <ArrowRight size={16} />
          </button>
        </div>
      </section>

      <Link href="/morador/reservas/nova">
        <Button className="w-full bg-[#582688] hover:bg-purple-900 text-white justify-center py-3 rounded-lg mb-8 text-base">
          Solicitar Nova Reserva <Plus size={20} className="ml-1" />
        </Button>
      </Link>

      <section>
        <h2 className="text-xl font-bold text-gray-800 mb-4">Minhas Reservas</h2>
        <div className="flex flex-col gap-4 mb-20">
          {carregando ? (
            <div className="bg-white border border-gray-200 rounded-xl p-5 text-sm text-gray-500 shadow-sm">
              Carregando reservas...
            </div>
          ) : reservasVisiveis.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-xl p-5 text-sm text-gray-500 shadow-sm">
              Voce ainda nao fez nenhuma reserva.
            </div>
          ) : (
            reservasVisiveis.map((reserva) => (
              <div key={reserva.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <div className="p-5 flex justify-between items-start gap-4">
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">{reserva.areaComum?.nome || "Area comum"}</h3>
                    <div className="flex items-center gap-2 text-gray-500 text-sm mt-3">
                      <CalendarIcon size={16} /> {formatarData(reserva.dataHora)}
                    </div>
                    <div className="flex items-center gap-2 text-gray-500 text-sm mt-1">
                      <Clock size={16} /> {formatarHora(reserva.dataHora)}
                    </div>
                  </div>
                  {renderBadge(reserva.status)}
                </div>

                {podeCancelar(reserva.status) && (
                  <div className="border-t border-gray-100 p-3 flex justify-center">
                    <button
                      type="button"
                      disabled={cancelandoId === reserva.id}
                      onClick={() => cancelarReserva(reserva.id)}
                      className="text-red-400 border border-red-400 rounded-lg py-1.5 px-6 text-sm font-medium hover:bg-red-50 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {cancelandoId === reserva.id ? "Cancelando..." : "Cancelar Reserva"}
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </section>
    </PageWrapper>
  )
}
