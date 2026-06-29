import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { autorizar } from '@/lib/authorize'

const TIME_ZONE = 'America/Sao_Paulo'

function minutosDoFormulario(valor) {
  if (typeof valor !== 'string') return null

  const match = valor.match(/(?:T|\s)(\d{2}):(\d{2})/)
  if (!match) return null

  return Number(match[1]) * 60 + Number(match[2])
}

function minutosNoFuso(data) {
  const partes = new Intl.DateTimeFormat('pt-BR', {
    timeZone: TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(data))

  const hora = Number(partes.find((parte) => parte.type === 'hour')?.value)
  const minuto = Number(partes.find((parte) => parte.type === 'minute')?.value)

  return hora * 60 + minuto
}

function horarioForaDoPeriodo(horario, inicio, fim) {
  if (inicio <= fim) return horario < inicio || horario > fim
  return horario < inicio && horario > fim
}

export async function GET(request) {
  const { response, session } = await autorizar('reservas')
  if (response) return response

  try {
    const searchParams = request.nextUrl.searchParams

    const areaComumId = searchParams.get('areaComumId')
    const status = searchParams.get('status')
    const minhas = searchParams.get('minhas')

    const where = {}

    if (areaComumId) {
      const areaComumIdNumber = Number(areaComumId)
      if (!Number.isInteger(areaComumIdNumber) || areaComumIdNumber <= 0) {
        return NextResponse.json({ error: 'ID da área comum inválido' }, { status: 400 })
      }
      where.areaComumId = areaComumIdNumber
    }

    if (status) {
      where.status = status
    }

    // RF11 — usado pela tela do morador para listar apenas as próprias reservas
    if (minhas === 'true') {
      const morador = await prisma.morador.findUnique({
        where: { usuarioId: Number(session.user.id) },
      })
      if (!morador) {
        return NextResponse.json({ error: 'Usuário autenticado não é um morador.' }, { status: 403 })
      }
      where.moradorId = morador.id
    }

    const reservas = await prisma.reserva.findMany({
      where,
      orderBy: {
        dataHora: 'asc'
      },
      select: {
        id: true,
        dataHora: true,
        criadoEm: true,
        status: true,
        justificativa: true,
        areaComum: {
          select: {
            nome: true,
            regras: { select: { antecedenciaMinCancelamento: true } },
          },
        },
        morador: {
          select: { usuario: { select: { nome: true } } }
        },
        areaComumId: true,
      }
    })

    return NextResponse.json(reservas, { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar reservas' }, { status: 500 })
  }
}

export async function POST(request) {
  const { response, session } = await autorizar('reservas')
  if (response) return response

  if (session.user.perfil !== 'morador') {
    return NextResponse.json({ error: 'Apenas moradores podem solicitar reservas.' }, { status: 403 })
  }

  try {
    const { areaComumId, dataHora } = await request.json()
    const idArea = Number(areaComumId)
    const dataReserva = new Date(dataHora)

    if (!Number.isInteger(idArea) || idArea <= 0 || Number.isNaN(dataReserva.getTime())) {
      return NextResponse.json({ error: 'Área e data da reserva são obrigatórias.' }, { status: 400 })
    }

    const [morador, area] = await Promise.all([
      prisma.morador.findUnique({ where: { usuarioId: Number(session.user.id) } }),
      prisma.areaComum.findUnique({ where: { id: idArea }, include: { regras: true } }),
    ])

    if (!morador) {
      return NextResponse.json({ error: 'Usuário autenticado não é um morador.' }, { status: 403 })
    }
    if (!area) {
      return NextResponse.json({ error: 'Área comum não encontrada.' }, { status: 404 })
    }
    if (dataReserva.getTime() <= Date.now()) {
      return NextResponse.json({ error: 'A reserva deve ser feita para uma data futura.' }, { status: 400 })
    }

    const regras = area.regras
    if (regras) {
      const horasAntecedencia = (dataReserva.getTime() - Date.now()) / (1000 * 60 * 60)
      if (horasAntecedencia < regras.antecedenciaMinimaReserva) {
        return NextResponse.json(
          { error: `A reserva precisa ser solicitada com pelo menos ${regras.antecedenciaMinimaReserva}h de antecedência.` },
          { status: 409 },
        )
      }

      const horaReserva = minutosDoFormulario(dataHora) ?? minutosNoFuso(dataReserva)
      const inicioMinutos = minutosNoFuso(regras.horarioPermitidoInicio)
      const fimMinutos = minutosNoFuso(regras.horarioPermitidoFim)

      if (horarioForaDoPeriodo(horaReserva, inicioMinutos, fimMinutos)) {
        return NextResponse.json({ error: 'O horário escolhido não está disponível para esta área.' }, { status: 409 })
      }
    }

    const [conflito, reservasAtivas] = await Promise.all([
      prisma.reserva.findFirst({
        where: { areaComumId: idArea, dataHora: dataReserva, status: { in: ['Pendente', 'Aprovada'] } },
      }),
      prisma.reserva.count({
        where: { moradorId: morador.id, status: { in: ['Pendente', 'Aprovada'] } },
      }),
    ])

    if (conflito) {
      return NextResponse.json({ error: 'Já existe uma solicitação para este horário.' }, { status: 409 })
    }
    if (regras && reservasAtivas >= regras.limiteReservasAtivas) {
      return NextResponse.json(
        { error: `Você atingiu o limite de ${regras.limiteReservasAtivas} reservas ativas.` },
        { status: 409 },
      )
    }

    const reserva = await prisma.reserva.create({
      data: { areaComumId: idArea, moradorId: morador.id, dataHora: dataReserva, status: 'Pendente' },
    })

    return NextResponse.json(reserva, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao solicitar reserva.' }, { status: 500 })
  }
}
