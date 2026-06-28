import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { autorizar } from '@/lib/authorize'
import { validarDadosRegras } from '@/lib/regrasReserva'

export async function GET() {
  const { response } = await autorizar('reservas')
  if (response) return response

  try {
    const areas = await prisma.areaComum.findMany({
      include: {
        regras: true,
        reservas: {
          select: {
            id: true,
            dataHora: true,
            status: true,
          },
          orderBy: {
            dataHora: 'asc',
          },
        },
      },
      orderBy: {
        nome: 'asc',
      },
    })

    return NextResponse.json(areas)
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar areas comuns' }, { status: 500 })
  }
}

export async function POST(request) {
  const { response } = await autorizar('areas-comuns')
  if (response) return response

  try {
    const data = await request.json()
    const { nome, descricao } = data

    if (!nome) {
      return NextResponse.json({ error: 'Todos os campos sao obrigatorios.' }, { status: 400 })
    }

    const validacaoRegras = validarDadosRegras(data)
    if (validacaoRegras.error) {
      return NextResponse.json({ error: validacaoRegras.error }, { status: 400 })
    }

    const areaExistente = await prisma.areaComum.findUnique({
      where: { nome },
    })

    if (areaExistente) {
      return NextResponse.json({ error: 'Ja existe uma area comum com esse nome' }, { status: 400 })
    }

    const novaArea = await prisma.areaComum.create({
      data: {
        nome,
        descricao,
        regras: {
          create: validacaoRegras.dados,
        },
      },
      include: { regras: true },
    })

    return NextResponse.json(novaArea, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao criar area comum' }, { status: 500 })
  }
}
