import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { autorizar } from '@/lib/authorize'

export async function DELETE(request, { params }) {
  const { response } = await autorizar('unidades')
  if (response) return response

  try {
    const id = Number(params.id)
    //validar id pra não dar cagada
    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    const existeUnidade = await prisma.unidade.findUnique({
      where: { id: id }
    })
    if (!existeUnidade) return NextResponse.json({ error: 'Unidade não existe' }, { status: 404 })

    const existeEncomenda = await prisma.encomenda.findFirst({
      where: { unidadeId: id }
    })

    const existeMorador = await prisma.morador.findFirst({
      where: { unidadeId: id }
    })

    if (existeEncomenda || existeMorador) return NextResponse.json({ error: 'Não é possível deletar essa unidade pois ela possui moradores ou encomendas vinculadas.' }, { status: 409 })

    await prisma.unidade.delete({
      where: { id: id }
    })

    return NextResponse.json({ message: 'Unidade deletada com sucesso' }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao deletar a unidade' }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
  const { response } = await autorizar('unidades')
  if (response) return response

  try {
    const id = Number(params.id)
    //validar id pra não dar cagada
    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    const existeUnidade = await prisma.unidade.findUnique({
      where: { id: id }
    })
    if (!existeUnidade) return NextResponse.json({ error: 'Unidade não existe' }, { status: 404 })

    const data = await request.json();
    const { bloco, andar, numero } = data

    if (!bloco || !andar || !numero) {
      return NextResponse.json({ error: 'Todos os campos são obrigatórios' }, { status: 400 });
    }

    const unidadeExistente = await prisma.unidade.findFirst({
      where: {
        id: { not: id },
        bloco,
        andar: parseInt(andar),
        numero,
      },
    });
    if (unidadeExistente) {
      return NextResponse.json({ error: 'Unidade já cadastrada' }, { status: 409 });
    }

    const unidadeAtualizada = await prisma.unidade.update({
      where: { id: id },
      data: {
        bloco,
        andar: parseInt(andar),
        numero,
      }
    })
    return NextResponse.json(unidadeAtualizada, { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao atualizar unidade' }, { status: 500 });
  }
}