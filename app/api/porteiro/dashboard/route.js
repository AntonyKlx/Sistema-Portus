import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { autorizar } from '@/lib/authorize'

const PERFIS_DASHBOARD = ['porteiro', 'sindico', 'administrador', 'adminMaster']

export async function GET() {
  const { response, session } = await autorizar()
  if (response) return response

  if (!PERFIS_DASHBOARD.includes(session.user.perfil)) {
    return NextResponse.json({ error: 'Seu perfil nao tem permissao para acessar este recurso.' }, { status: 403 })
  }

  try {
    const [encomendasPendentes, reservasPendentes, moradoresAtivos, encomendasRecentes] = await Promise.all([
      prisma.encomenda.count({
        where: { status: 'Aguardando Retirada' },
      }),
      prisma.reserva.count({
        where: { status: 'Pendente' },
      }),
      prisma.morador.count({
        where: { usuario: { ativo: true } },
      }),
      prisma.encomenda.findMany({
        take: 3,
        orderBy: { dataHoraChegada: 'desc' },
        include: {
          unidade: {
            include: {
              moradores: {
                take: 1,
                include: { usuario: true },
              },
            },
          },
        },
      }),
    ])

    return NextResponse.json({
      cards: {
        encomendasPendentes,
        reservasPendentes,
        moradoresAtivos,
      },
      encomendasRecentes: encomendasRecentes.map((encomenda) => ({
        id: encomenda.id,
        apartamento: `Apartamento ${encomenda.unidade.numero}`,
        morador: encomenda.unidade.moradores[0]?.usuario?.nome || 'Sem morador',
        data: encomenda.dataHoraChegada,
        status: encomenda.status,
      })),
    })
  } catch (error) {
    console.error('Erro ao carregar dashboard:', error)
    return NextResponse.json({ error: 'Erro ao carregar dashboard' }, { status: 500 })
  }
}
