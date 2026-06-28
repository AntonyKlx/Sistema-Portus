import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { autorizar } from '@/lib/authorize'

export async function GET() {
  const { response } = await autorizar('moradores')
  if (response) return response

  try {
    const moradores = await prisma.morador.findMany({
      include: {
        usuario: {
          select: { id: true, nome: true, email: true, ativo: true },
        },
        unidade: {
          select: { id: true, bloco: true, andar: true, numero: true },
        },
      },
      orderBy: { usuario: { nome: 'asc' } },
    })
    return NextResponse.json(moradores)
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar moradores' }, { status: 500 })
  }
}

export async function POST(request) {
  const { response } = await autorizar('moradores')
  if (response) return response

  try {
    const data = await request.json()
    const { nome, email, senha, telefone, unidadeId, inadimplente } = data

    if (!nome || !email || !senha || !telefone || !unidadeId) {
      return NextResponse.json({ error: 'Todos os campos obrigatórios devem ser preenchidos' }, { status: 400 })
    }

    // Verificar se e-mail já está em uso
    const emailExistente = await prisma.usuario.findUnique({ where: { email } })
    if (emailExistente) {
      return NextResponse.json({ error: 'E-mail já cadastrado' }, { status: 409 })
    }

    // Verificar se a unidade existe
    const unidade = await prisma.unidade.findUnique({ where: { id: parseInt(unidadeId) } })
    if (!unidade) {
      return NextResponse.json({ error: 'Unidade não encontrada' }, { status: 404 })
    }

    // Buscar perfil de morador
    const perfilMorador = await prisma.perfilAcesso.findFirst({ where: { nome: 'morador' } })
    if (!perfilMorador) {
      return NextResponse.json({ error: 'Perfil de morador não encontrado' }, { status: 500 })
    }

    const bcrypt = require('bcryptjs')
    const senhaCriptografada = await bcrypt.hash(senha, 10)

    const novoUsuario = await prisma.usuario.create({
      data: {
        nome,
        email,
        senha: senhaCriptografada,
        ativo: true,
        tentativasIncorretas: 0,
        perfilId: perfilMorador.id,
        morador: {
          create: {
            telefone,
            inadimplente: inadimplente ?? false,
            unidadeId: parseInt(unidadeId),
          },
        },
      },
      include: {
        morador: {
          include: {
            unidade: { select: { id: true, bloco: true, andar: true, numero: true } },
          },
        },
      },
    })

    return NextResponse.json(novoUsuario.morador, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao cadastrar morador' }, { status: 500 })
  }
}