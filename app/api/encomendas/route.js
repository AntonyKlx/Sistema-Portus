import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { autorizar } from '@/lib/authorize'

export async function GET(request) {
  const { response } = await autorizar('encomendas')
  if (response) return response

  try {
    const searchParams = request.nextUrl.searchParams
    const unidadeId = searchParams.get('unidadeId')
    const unidadeIdNumber = Number(unidadeId)
    const statusParams = searchParams.get('status')


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

    //busco encomendas da unidade x
    const where = {
      unidadeId: unidadeIdNumber
    }

    if (statusParams !== null)
      where.status = statusParams

    const encomendas = await prisma.encomenda.findMany({
      where,
      orderBy: {
        dataHoraChegada: 'desc'
      }
    })
    return NextResponse.json(encomendas)
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar encomendas' }, { status: 500 })
  }
}