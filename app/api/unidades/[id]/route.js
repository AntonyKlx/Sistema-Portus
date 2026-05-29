import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function DELETE(request, { params }) {
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