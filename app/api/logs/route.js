import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { autorizar } from '@/lib/authorize'

export async function GET(request) {
  const { response } = await autorizar('logs')
  if (response) return response

  try {
    const searchParams = request.nextUrl.searchParams
    const usuarioId = searchParams.get('usuarioId')
    const dataInicio = searchParams.get('dataInicio')
    const dataFim = searchParams.get('dataFim')
    const busca = searchParams.get('busca')
    const perfil = searchParams.get('perfil')
    const tipoAcao = searchParams.get('tipoAcao')

    const filtros = []

    if (usuarioId) {
      const id = Number(usuarioId)
      if (!Number.isInteger(id) || id <= 0) {
        return NextResponse.json({ error: 'Usuario invalido' }, { status: 400 })
      }
      filtros.push({ usuarioId: id })
    }

    if (dataInicio || dataFim) {
      const filtroData = {}

      if (dataInicio) {
        const inicio = new Date(`${dataInicio}T00:00:00`)
        if (Number.isNaN(inicio.getTime())) {
          return NextResponse.json({ error: 'Data inicial invalida' }, { status: 400 })
        }
        filtroData.gte = inicio
      }

      if (dataFim) {
        const fim = new Date(`${dataFim}T23:59:59.999`)
        if (Number.isNaN(fim.getTime())) {
          return NextResponse.json({ error: 'Data final invalida' }, { status: 400 })
        }
        filtroData.lte = fim
      }

      filtros.push({ dataHora: filtroData })
    }

    if (busca?.trim()) {
      const termo = busca.trim()

      filtros.push({
        OR: [
          { acaoExecutada: { contains: termo } },
          { usuario: { nome: { contains: termo } } },
          { usuario: { email: { contains: termo } } },
        ],
      })
    }

    if (perfil?.trim()) {
      filtros.push({
        usuario: {
          perfil: {
            nome: perfil.trim(),
          },
        },
      })
    }

    const termosPorTipo = {
      cadastro: ['Registrou', 'Cadastrou'],
      aprovacao: ['Aprovou'],
      reprovacao: ['Reprovou'],
      baixa: ['Deu baixa', 'Retirada'],
      remocao: ['Removeu', 'Deletou', 'Excluiu'],
    }

    if (tipoAcao?.trim() && termosPorTipo[tipoAcao]) {
      filtros.push({
        OR: termosPorTipo[tipoAcao].map((termo) => ({
          acaoExecutada: { contains: termo },
        })),
      })
    }

    const where = filtros.length ? { AND: filtros } : {}

    const logs = await prisma.logAcesso.findMany({
      where,
      include: {
        usuario: {
          select: {
            id: true,
            nome: true,
            email: true,
            perfil: { select: { nome: true } },
          },
        },
      },
      orderBy: {
        dataHora: 'desc',
      },
    })

    return NextResponse.json(logs, { status: 200 })
  } catch (error) {
    console.error('Erro ao buscar logs:', error)
    return NextResponse.json({ error: 'Erro ao buscar logs de acesso' }, { status: 500 })
  }
}
