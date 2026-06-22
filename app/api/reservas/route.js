import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { autorizar } from '@/lib/authorize'

export async function GET(request) {
  const { response } = await autorizar('reservas')
  if (response) return response

  try {
    const searchParams = request.nextUrl.searchParams

    const areaComumId = searchParams.get('areaComumId')
    const status = searchParams.get('status')

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

    const reservas = await prisma.reserva.findMany({
      where,
      orderBy: {
        dataHora: 'asc'
      },
      select: {
        id: true,
        dataHora: true,
        status: true,
        areaComum: { select: { nome: true } },
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