import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { autorizar } from '@/lib/authorize'

export async function POST(request) {
  const { response, session } = await autorizar('reservas')
  if (response) return response

  try {
    const { areaComumId, dataHora } = await request.json()
    const usuarioId = Number(session.user.id)

    if (!Number.isInteger(areaComumId) || areaComumId <= 0) {
      return NextResponse.json({ error: 'ID da área comum inválido.' }, { status: 400 })
    }
    if (!dataHora || isNaN(new Date(dataHora).getTime())) {
      return NextResponse.json({ error: 'Data e hora da reserva inválidas.' }, { status: 400 })
    }

    const dataHoraReserva = new Date(dataHora)

    const [morador, regras] = await Promise.all([
      prisma.morador.findUnique({ where: { usuarioId } }),
      prisma.regrasReserva.findUnique({ where: { areaComumId } }),
    ])

    if (!morador) {
      return NextResponse.json({ error: 'Usuário não é um morador válido.' }, { status: 403 })
    }

    if (!regras) {
      return NextResponse.json(
        { error: 'A área comum não possui regras de reserva configuradas.' },
        { status: 400 }
      )
    }

    // Antecedência Mínima da Reserva
    const agora = new Date()
    const dataLimite = new Date(agora.getTime() + regras.antecedenciaMinimaReserva * 60 * 60 * 1000)

    if (dataHoraReserva < dataLimite) {
      return NextResponse.json(
        {
          error: `A reserva deve ser feita com no mínimo ${regras.antecedenciaMinimaReserva}h de antecedência.`,
        },
        { status: 409 }
      )
    }

    //Limite de Reservas Ativas
    const reservasAtivas = await prisma.reserva.count({
      where: {
        moradorId: morador.id,
        status: { in: ['Pendente', 'Aprovada'] },
      },
    })

    if (reservasAtivas >= regras.limiteReservasAtivas) {
      return NextResponse.json(
        {
          error: `Você atingiu o limite de ${regras.limiteReservasAtivas} reservas ativas (pendentes ou aprovadas).`,
        },
        { status: 409 }
      )
    }

    // Disponibilidade de Horário
    const dataQuery = dataHoraReserva.toISOString().split('T')[0]
    const inicioPermitido = new Date(`${dataQuery}T${new Date(regras.horarioPermitidoInicio).toISOString().substring(11, 19)}Z`)
    const fimPermitido = new Date(`${dataQuery}T${new Date(regras.horarioPermitidoFim).toISOString().substring(11, 19)}Z`)

    if (dataHoraReserva < inicioPermitido || dataHoraReserva > fimPermitido) {
      return NextResponse.json(
        { error: 'O horário solicitado está fora do período permitido para reservas nesta área.' },
        { status: 409 }
      )
    }

    const reservaExistente = await prisma.reserva.findFirst({
      where: {
        areaComumId: areaComumId,
        dataHora: dataHoraReserva,
        status: 'Aprovada',
      },
    })

    if (reservaExistente) {
      return NextResponse.json(
        { error: 'Este horário já foi reservado e aprovado.' },
        { status: 409 }
      )
    }

    const novaReserva = await prisma.reserva.create({
      data: {
        areaComumId: areaComumId,
        moradorId: morador.id,
        dataHora: dataHoraReserva,
        status: 'Pendente',
      },
    })

    return NextResponse.json(novaReserva, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar reserva:', error)
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Já existe uma solicitação de reserva para este horário.' },
        { status: 409 }
      )
    }
    return NextResponse.json(
      { error: 'Erro interno ao processar a solicitação.' },
      { status: 500 }
    )
  }
}