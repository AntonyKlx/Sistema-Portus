import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { autorizar } from '@/lib/authorize'
import { registrarLog } from '@/lib/log'

export async function PUT(request, { params: paramsPromise }) {
  const { response, session } = await autorizar('reservas')
  if (response) return response

  if (!['sindico', 'administrador', 'adminMaster'].includes(session.user.perfil)) {
    return NextResponse.json({ error: 'Apenas gestores podem avaliar reservas.' }, { status: 403 })
  }

  try {
    const params = await paramsPromise
    const id = Number(params.id)

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: 'ID invalido' }, { status: 400 })
    }

    const data = await request.json()
    const { status, justificativa } = data

    if (status !== 'Aprovada' && status !== 'Reprovada') {
      return NextResponse.json({ error: 'Status invalido' }, { status: 400 })
    }

    const existeReserva = await prisma.reserva.findUnique({
      where: { id },
      include: {
        areaComum: true,
        morador: {
          include: {
            usuario: true,
          },
        },
      },
    })

    if (!existeReserva) {
      return NextResponse.json({ error: 'A reserva com esse ID nao existe' }, { status: 404 })
    }

    if (existeReserva.status !== 'Pendente') {
      return NextResponse.json({ error: 'Esta reserva ja foi avaliada anteriormente.' }, { status: 409 })
    }

    const reservaAtualizada = await prisma.reserva.update({
      where: { id },
      data: {
        status,
        justificativa,
      },
    })

    const acaoLog = status === 'Aprovada' ? 'Aprovou' : 'Reprovou'
    void registrarLog(
      session.user.id,
      `${acaoLog} reserva de ${existeReserva.areaComum.nome} para ${new Date(existeReserva.dataHora).toLocaleString('pt-BR')}`
    )

    return NextResponse.json({ reservaAtualizada }, { status: 200 })
  } catch (error) {
    console.error('Erro interno ao processar a reserva:', error)
    return NextResponse.json({ error: 'Erro interno ao processar a reserva' }, { status: 500 })
  }
}

// RF11 - Cancelar Reserva
export async function DELETE(request, { params: paramsPromise }) {
  const { response, session } = await autorizar('reservas')
  if (response) return response

  try {
    const params = await paramsPromise
    const id = Number(params.id)

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: 'ID invalido' }, { status: 400 })
    }

    const reserva = await prisma.reserva.findUnique({
      where: { id },
      include: {
        morador: { include: { usuario: true } },
        areaComum: { include: { regras: true } },
      },
    })

    if (!reserva) {
      return NextResponse.json({ error: 'A reserva com esse ID nao existe' }, { status: 404 })
    }

    const perfilUsuario = session.user.perfil
    const ehGestor = ['sindico', 'administrador', 'adminMaster'].includes(perfilUsuario)

    if (!ehGestor && reserva.morador.usuarioId !== Number(session.user.id)) {
      return NextResponse.json(
        { error: 'Voce so pode cancelar suas proprias reservas.' },
        { status: 403 }
      )
    }

    if (!['Pendente', 'Aprovada'].includes(reserva.status)) {
      return NextResponse.json(
        { error: 'Apenas reservas pendentes ou aprovadas podem ser canceladas.' },
        { status: 409 }
      )
    }

    const regras = reserva.areaComum.regras
    if (!ehGestor && regras) {
      const horasAteReserva = (new Date(reserva.dataHora).getTime() - Date.now()) / (1000 * 60 * 60)

      if (horasAteReserva < regras.antecedenciaMinCancelamento) {
        return NextResponse.json(
          {
            error: `Cancelamento fora do prazo. E necessario cancelar com pelo menos ${regras.antecedenciaMinCancelamento}h de antecedencia. Contate o sindico.`,
          },
          { status: 409 }
        )
      }
    }

    const reservaCancelada = await prisma.reserva.update({
      where: { id },
      data: { status: 'Cancelada' },
    })

    return NextResponse.json({ reservaCancelada }, { status: 200 })
  } catch (error) {
    console.error('Erro interno ao cancelar a reserva:', error)
    return NextResponse.json({ error: 'Erro interno ao cancelar a reserva' }, { status: 500 })
  }
}
