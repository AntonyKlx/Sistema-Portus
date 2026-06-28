import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const PERFIS_PADRAO = ['morador', 'porteiro', 'sindico']

export async function GET(request, { params: paramsPromise }) {
  try {
    const params = await paramsPromise
    const id = Number(params.id)
    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    const perfil = await prisma.perfilAcesso.findUnique({
      where: { id },
      include: {
        permissoes: { select: { id: true, nome: true } },
        _count: { select: { usuarios: true } },
      },
    })

    if (!perfil) {
      return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 })
    }

    return NextResponse.json(perfil)
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar perfil' }, { status: 500 })
  }
}

export async function PUT(request, { params: paramsPromise }) {
  try {
    const params = await paramsPromise
    const id = Number(params.id)
    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    const perfil = await prisma.perfilAcesso.findUnique({ where: { id } })
    if (!perfil) {
      return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 })
    }

    const data = await request.json()
    const { nome, permissoes } = data

    if (!nome || !nome.trim()) {
      return NextResponse.json({ error: 'O nome do perfil é obrigatório' }, { status: 400 })
    }

    const nomeNormalizado = nome.trim()

    if (
      PERFIS_PADRAO.includes(perfil.nome.toLowerCase()) &&
      nomeNormalizado.toLowerCase() !== perfil.nome.toLowerCase()
    ) {
      return NextResponse.json(
        { error: 'O nome de um perfil padrão do sistema não pode ser alterado.' },
        { status: 403 }
      )
    }

    const nomeEmUso = await prisma.perfilAcesso.findFirst({
      where: { nome: nomeNormalizado, id: { not: id } },
    })
    if (nomeEmUso) {
      return NextResponse.json({ error: 'Já existe um perfil com esse nome' }, { status: 409 })
    }

    const listaPermissoes = Array.isArray(permissoes)
      ? permissoes.map((p) => String(p).trim()).filter(Boolean)
      : []

    const resultado = await prisma.$transaction(async (tx) => {
      await tx.permissao.deleteMany({ where: { perfilId: id } })

      return tx.perfilAcesso.update({
        where: { id },
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
    })

    return NextResponse.json(resultado, { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao atualizar perfil' }, { status: 500 })
  }
}

export async function DELETE(request, { params: paramsPromise }) {
  try {
    const params = await paramsPromise
    const id = Number(params.id)
    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    const perfil = await prisma.perfilAcesso.findUnique({
      where: { id },
      include: { _count: { select: { usuarios: true } } },
    })
    if (!perfil) {
      return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 })
    }

    if (PERFIS_PADRAO.includes(perfil.nome.toLowerCase())) {
      return NextResponse.json(
        { error: 'Este é um perfil padrão do sistema e não pode ser removido.' },
        { status: 403 }
      )
    }

    if (perfil._count.usuarios > 0) {
      return NextResponse.json(
        { error: 'Não é possível remover um perfil vinculado a usuários existentes.' },
        { status: 409 }
      )
    }

    await prisma.$transaction(async (tx) => {
      await tx.permissao.deleteMany({ where: { perfilId: id } })
      await tx.perfilAcesso.delete({ where: { id } })
    })

    return NextResponse.json({ message: 'Perfil removido com sucesso' }, { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao remover perfil' }, { status: 500 })
  }
}