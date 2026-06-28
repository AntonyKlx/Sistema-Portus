import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { autorizar } from '@/lib/authorize'
import { validarDadosRegras } from '@/lib/regrasReserva'

async function buscarArea(id) {
  if (!Number.isInteger(id) || id <= 0) {
    return { response: NextResponse.json({ error: 'ID invalido' }, { status: 400 }) }
  }

  const area = await prisma.areaComum.findUnique({
    where: { id },
    select: { id: true, nome: true },
  })

  if (!area) {
    return { response: NextResponse.json({ error: 'Area comum nao encontrada.' }, { status: 404 }) }
  }

  return { area }
}

export async function GET(request, { params }) {
  const { response } = await autorizar('areas-comuns')
  if (response) return response

  try {
    const parametros = await params
    const id = Number(parametros.id)
    const { area, response: areaResponse } = await buscarArea(id)
    if (areaResponse) return areaResponse

    const regras = await prisma.regrasReserva.findUnique({
      where: { areaComumId: id },
    })

    return NextResponse.json({ area, regras }, { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar regras da area comum' }, { status: 500 })
  }
}

export async function POST(request, { params }) {
  const { response } = await autorizar('areas-comuns')
  if (response) return response

  try {
    const parametros = await params
    const id = Number(parametros.id)
    const { response: areaResponse } = await buscarArea(id)
    if (areaResponse) return areaResponse

    const data = await request.json()
    const validacao = validarDadosRegras(data)

    if (validacao.error) {
      return NextResponse.json({ error: validacao.error }, { status: 400 })
    }

    const regras = await prisma.regrasReserva.upsert({
      where: { areaComumId: id },
      update: validacao.dados,
      create: {
        ...validacao.dados,
        areaComumId: id,
      },
    })

    return NextResponse.json(regras, { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao salvar regras da area comum' }, { status: 500 })
  }
}

export async function PUT(request, context) {
  return POST(request, context)
}
