'use client'

import Link from "next/link"
import { useState, useMemo } from 'react'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, Plus, ArrowRight } from 'lucide-react'
import { PageWrapper, Button } from "@/components/ui"

function tituloMes(data) {
  return new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(data);
}

function chaveData(data) {
  const valor = new Date(data);
  return `${valor.getFullYear()}-${String(valor.getMonth() + 1).padStart(2, "0")}-${String(valor.getDate()).padStart(2, "0")}`;
}

export default function ReservasMoradorPage() {
  const [mesExibido, setMesExibido] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));

  const diasCalendario = useMemo(() => {
    const primeiroDia = new Date(mesExibido.getFullYear(), mesExibido.getMonth(), 1);
    const ultimoDia = new Date(mesExibido.getFullYear(), mesExibido.getMonth() + 1, 0);
    const inicio = (primeiroDia.getDay() + 6) % 7; // Ajuste para começar na Segunda
    const totalCelulas = Math.ceil((inicio + ultimoDia.getDate()) / 7) * 7;

    return Array.from({ length: totalCelulas }, (_, indice) => {
      const dia = indice - inicio + 1;
      return dia > 0 && dia <= ultimoDia.getDate() 
        ? new Date(mesExibido.getFullYear(), mesExibido.getMonth(), dia) 
        : null;
    });
  }, [mesExibido]);

  const minhasReservas = [
    {
      id: 1,
      area: "Área de Churrasco",
      data: "20/05/2026",
      horario: "10h às 14h",
      status: "Aprovado"
    },
    {
      id: 2,
      area: "Área de Churrasco",
      data: "20/05/2026",
      horario: "10h às 14h",
      status: "Pendente"
    }
  ];

  const diasReservados = new Set([
    chaveData(new Date(new Date().getFullYear(), new Date().getMonth(), 20))
  ]);

  const renderBadge = (status) => {
    if (status === "Aprovado") {
      return (
        <span className="border border-green-500 text-green-600 bg-white rounded-full px-3 py-0.5 text-xs font-medium">
          Aprovado
        </span>
      );
    }
    return (
      <span className="border border-yellow-400 text-yellow-500 bg-white rounded-full px-3 py-0.5 text-xs font-medium">
        Pendente
      </span>
    );
  };

  return (
    <PageWrapper>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Reservas</h1>
        <p className="text-[#582688] text-sm mt-1">Visualize suas reservas.</p>
      </div>

      <section className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Calendário de Reservas</h2>
        
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          {/* Controle do Mês Dinâmico */}
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

          {/* Renderização Dinâmica dos Dias */}
          <div className="grid grid-cols-7 gap-y-4 text-center text-sm text-gray-600">
            {diasCalendario.map((dia, indice) => {
              const reservado = dia && diasReservados.has(chaveData(dia));
              
              return (
                <div key={`${dia?.toISOString() || "vazio"}-${indice}`} className="flex justify-center relative">
                  {dia ? (
                    <span className={`w-8 h-8 flex items-center justify-center ${reservado ? 'text-[#582688] font-semibold' : ''}`}>
                      {dia.getDate()}
                      {reservado && (
                        <span className="absolute bottom-0 w-1 h-1 bg-[#582688] rounded-full"></span>
                      )}
                    </span>
                  ) : (
                    // Espaços vazios para alinhar o calendário corretamente
                    <span className="w-8 h-8 flex items-center justify-center"></span>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex items-center gap-2 text-xs text-gray-500 border-t border-gray-100 pt-4">
            <span className="w-1.5 h-1.5 bg-[#582688] rounded-full"></span>
            Reserva Aprovada
          </div>
        </div>

        <div className="flex justify-end mt-3">
          <button className="text-[#582688] text-sm font-semibold flex items-center gap-1 hover:underline">
            Ver histórico Completo <ArrowRight size={16} />
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
          {minhasReservas.map((reserva) => (
            <div key={reserva.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <div className="p-5 flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">{reserva.area}</h3>
                  <div className="flex items-center gap-2 text-gray-500 text-sm mt-3">
                    <CalendarIcon size={16} /> {reserva.data}
                  </div>
                  <div className="flex items-center gap-2 text-gray-500 text-sm mt-1">
                    <Clock size={16} /> {reserva.horario}
                  </div>
                </div>
                {renderBadge(reserva.status)}
              </div>
              <div className="border-t border-gray-100 p-3 flex justify-center">
                <button className="text-red-400 border border-red-400 rounded-lg py-1.5 px-6 text-sm font-medium hover:bg-red-50 transition-colors">
                  Cancelar Reserva
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </PageWrapper>
  )
}