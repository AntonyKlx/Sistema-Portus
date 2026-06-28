import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { autorizar } from '@/lib/authorize'
import { validarDadosRegras } from '@/lib/regrasReserva'

export async function DELETE(request, { params }) {
  const { response } = await autorizar('areas-comuns')
  if (response) return response

  try {
    const parametros = await params
    const id = Number(parametros.id)

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: 'ID invalido' }, { status: 400 })
    }

    const existeAreaComum = await prisma.areaComum.findUnique({
      where: { id },
    })

    if (!existeAreaComum) {
      return NextResponse.json({ error: 'Area comum nao existe' }, { status: 404 })
    }

    const existeReservaAtiva = await prisma.reserva.findFirst({
      where: {
        areaComumId: id,
        status: { in: ['Pendente', 'Aprovada'] },
      },
    })

    const url = new URL(request.url)
    const confirmou = url.searchParams.get('confirmar') === 'true'

    if (existeReservaAtiva && !confirmou) {
      return NextResponse.json(
        { error: 'Existem reservas pendentes para essa area comum. Confirma a exclusao?' },
        { status: 409 },
      )
    }

    await prisma.reserva.deleteMany({
      where: { areaComumId: id },
    })

    await prisma.regrasReserva.deleteMany({
      where: { areaComumId: id },
    })

    await prisma.areaComum.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Area comum deletada com sucesso' }, { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao deletar a area comum' }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
  const { response } = await autorizar('areas-comuns')
  if (response) return response

  try {
    const parametros = await params
    const id = Number(parametros.id)

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: 'ID invalido' }, { status: 400 })
    }

    const existeAreaComum = await prisma.areaComum.findUnique({
      where: { id },
    })

    if (!existeAreaComum) {
      return NextResponse.json({ error: 'Area comum nao existe' }, { status: 404 })
    }

    const data = await request.json()
    const { nome, descricao } = data

    if (!nome) {
      return NextResponse.json({ error: 'Todos os campos sao obrigatorios.' }, { status: 400 })
    }

    const validacaoRegras = validarDadosRegras(data)
    if (validacaoRegras.error) {
      return NextResponse.json({ error: validacaoRegras.error }, { status: 400 })
    }

    const areaExistente = await prisma.areaComum.findFirst({
      where: {
        id: { not: id },
        nome,
      },
    })

    if (areaExistente) {
      return NextResponse.json({ error: 'Ja existe uma area comum com esse nome' }, { status: 409 })
    }

    const areaAtualizada = await prisma.areaComum.update({
      where: { id },
      data: {
        nome,
        descricao,
        regras: {
          upsert: {
            update: validacaoRegras.dados,
            create: validacaoRegras.dados,
          },
        },
      },
      include: { regras: true },
    })

    return NextResponse.json(areaAtualizada, { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao atualizar area comum' }, { status: 500 })
  }
}
