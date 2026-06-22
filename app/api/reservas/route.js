import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { autorizar } from '@/lib/authorize'

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
        }
      }
    })

    return NextResponse.json(reservas, { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar reservas' }, { status: 500 })
  }
}