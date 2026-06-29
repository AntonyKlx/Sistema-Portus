'use client'

import { useState, useEffect } from 'react'
import { PageWrapper, Button, Select, Input } from "@/components/ui"

export default function NovaReservaPage() {
  console.log("COMPONENTE RENDERIZOU")

  const [areas, setAreas] = useState([])
  const [formData, setFormData] = useState({ areaId: '', data: '' })

  const [horarios, setHorarios] = useState([])
  const [horarioSelecionado, setHorarioSelecionado] = useState('')

  const [enviando, setEnviando] = useState(false)
  const [mensagem, setMensagem] = useState(null)

  // Busca áreas
  useEffect(() => {
    fetch('/api/areas')
      .then(res => res.json())
      .then(data => {
        console.log("Áreas recebidas:", data)
        setAreas(data)
      })
      .catch(err => console.error("Erro ao buscar áreas:", err))
  }, [])

  // Busca disponibilidade sempre que a área ou a data mudarem
  useEffect(() => {
    console.log("formData atual:", formData)
    if (formData.areaId && formData.data) {
      fetch(`/api/areas/${formData.areaId}/disponibilidade?data=${formData.data}`)
        .then(res => res.json())
        .then(data => {
          console.log("Resposta da API:", data)
          setHorarios(data.horariosDisponiveis || [])
        })
        .catch(err => {
          console.error("Erro ao buscar horários:", err)
          setHorarios([])
        })
    }
  }, [formData.areaId, formData.data])

  async function confirmarReserva() {
  setEnviando(true)
  setMensagem(null)

  try {
    const dataHora = `${formData.data}T${horarioSelecionado}:00Z`

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

    setMensagem({ tipo: 'sucesso', texto: 'Reserva solicitada! Aguardando aprovação.' })
    setHorarioSelecionado('')
  } catch (err) {
    console.error('Erro ao confirmar reserva:', err)
    setMensagem({ tipo: 'erro', texto: 'Erro ao enviar a solicitação.' })
  } finally {
      setEnviando(false)
    }
  }

  return (
    <PageWrapper>
      <h1 className="text-2xl font-bold mb-6">Solicitar Nova Reserva - TESTE</h1>

      <div className="bg-white p-6 rounded-lg shadow">
        <Select 
          label="Selecione a Área"
          value={formData.areaId}
          options={[
            { value: '', label: 'Selecione uma área' },
            ...areas.map(a => ({ value: String(a.id), label: a.nome }))
          ]}
          onChange={(e) => setFormData({...formData, areaId: e.target.value})}
        />

        <Input
          type="date"
          label="Data da Reserva"
          value={formData.data}
          onChange={(e) => setFormData({ ...formData, data: e.target.value })}
          min={new Date().toISOString().split('T')[0]}
          className="mb-6"
        />

        {/* Exibição dos Horários */}
        {horarios.length > 0 && (
          <div className="grid grid-cols-4 gap-2 mb-4">
            {horarios.map((hora) => (
              <button
                key={hora}
                type="button"
                onClick={() => setHorarioSelecionado(hora)}
                className={`p-2 rounded border ${horarioSelecionado === hora ? 'bg-indigo-600 text-white' : 'bg-gray-100'}`}
              >
                {hora}
              </button>
            ))}
          </div>
        )}

        <Button 
          disabled={!horarioSelecionado || enviando} 
          onClick={confirmarReserva}
          className="mt-4"
        >
          {enviando ? 'Enviando...' : 'Solicitar'}
        </Button>

        {mensagem && (
          <p className={`mt-3 text-sm ${mensagem.tipo === 'erro' ? 'text-red-600' : 'text-green-600'}`}>
            {mensagem.texto}
          </p>
        )}
      </div>
    </PageWrapper>
  )
}