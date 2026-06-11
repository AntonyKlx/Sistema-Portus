import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request) {
  try {
    const searchParams = request.nextUrl.searchParams
    const unidadeId = searchParams.get('unidadeId')
    const unidadeIdNumber = Number(unidadeId)

    if (!unidadeId) {
      return NextResponse.json({ error: 'É preciso informar o id da unidade' }, { status: 400 })
    }

    if (!Number.isInteger(unidadeIdNumber) || unidadeIdNumber <= 0) {
      return NextResponse.json({ error: 'ID invláido' }, { status: 400 })
    }

    const unidadeExistente = await prisma.unidade.findUnique({
      where: { id: unidadeIdNumber }
    })
    if (!unidadeExistente) {
      return NextResponse.json({ error: 'Unidade não existe' }, { status: 404 })
    }

    const encomendasPendentes = await prisma.encomenda.findMany({
      where: {
        unidadeId: unidadeIdNumber,
        status: 'Aguardando Retirada'
      },
      orderBy: {
        dataHoraChegada: 'desc'
      }
    })
    return NextResponse.json(encomendasPendentes)
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar encomendas pendentes' }, { status: 500 })
  }
}
