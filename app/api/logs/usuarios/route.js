import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { autorizar } from '@/lib/authorize'

export async function GET() {
  const { response } = await autorizar('logs')
  if (response) return response

  try {
    const usuarios = await prisma.usuario.findMany({
      select: {
        id: true,
        nome: true,
        email: true,
        perfil: { select: { nome: true } },
      },
      orderBy: { nome: 'asc' },
    })

    return NextResponse.json(usuarios, { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar usuarios' }, { status: 500 })
  }
}
