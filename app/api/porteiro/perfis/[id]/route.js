import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const perfis = await prisma.perfilAcesso.findMany({
      include: {
        permissoes: { select: { id: true, nome: true } },
        _count: { select: { usuarios: true } },
      },
      orderBy: { nome: 'asc' },
    })
    return NextResponse.json(perfis)
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar perfis' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const data = await request.json()
    const { nome, permissoes } = data

    if (!nome || !nome.trim()) {
      return NextResponse.json({ error: 'O nome do perfil é obrigatório' }, { status: 400 })
    }

    const nomeNormalizado = nome.trim()

    const existente = await prisma.perfilAcesso.findUnique({ where: { nome: nomeNormalizado } })
    if (existente) {
      return NextResponse.json({ error: 'Já existe um perfil com esse nome' }, { status: 409 })
    }

    const listaPermissoes = Array.isArray(permissoes)
      ? permissoes.map((p) => String(p).trim()).filter(Boolean)
      : []

    const novoPerfil = await prisma.perfilAcesso.create({
      data: {
        nome: nomeNormalizado,
        permissoes: {
          create: listaPermissoes.map((nomePermissao) => ({ nome: nomePermissao })),
        },
      },
      include: {
        permissoes: { select: { id: true, nome: true } },
        _count: { select: { usuarios: true } },
      },
    })

    return NextResponse.json(novoPerfil, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao cadastrar perfil' }, { status: 500 })
  }
}