import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { autorizar } from '@/lib/authorize'

const PERFIS_ADMIN = ['administrador', 'adminMaster']

export async function GET() {
  const { response } = await autorizar('admins')
  if (response) return response

  try {
    const admins = await prisma.usuario.findMany({
      where: { perfil: { nome: { in: PERFIS_ADMIN } } },
      select: {
        id: true,
        nome: true,
        email: true,
        ativo: true,
        criadoEm: true,
        perfil: { select: { id: true, nome: true } },
      },
      orderBy: { nome: 'asc' },
    })
    return NextResponse.json(admins)
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar administradores' }, { status: 500 })
  }
}

export async function POST(request) {
  const { response } = await autorizar('admins')
  if (response) return response

  try {
    const data = await request.json()
    const { nome, email, senha, nivel } = data

    if (!nome || !email || !senha || !nivel) {
      return NextResponse.json(
        { error: 'Nome, e-mail, senha e nível de permissão são obrigatórios' },
        { status: 400 }
      )
    }

    if (!PERFIS_ADMIN.includes(nivel)) {
      return NextResponse.json(
        { error: 'Nível de permissão inválido. Use "administrador" ou "adminMaster".' },
        { status: 400 }
      )
    }

    const emailExistente = await prisma.usuario.findUnique({ where: { email } })
    if (emailExistente) {
      return NextResponse.json({ error: 'E-mail já cadastrado' }, { status: 409 })
    }

    const perfil = await prisma.perfilAcesso.findFirst({ where: { nome: nivel } })
    if (!perfil) {
      return NextResponse.json({ error: 'Perfil de acesso não encontrado' }, { status: 500 })
    }

    const senhaCriptografada = await bcrypt.hash(senha, 10)

    const novoAdmin = await prisma.usuario.create({
      data: {
        nome,
        email,
        senha: senhaCriptografada,
        ativo: true,
        tentativasIncorretas: 0,
        perfilId: perfil.id,
      },
      select: {
        id: true,
        nome: true,
        email: true,
        ativo: true,
        criadoEm: true,
        perfil: { select: { id: true, nome: true } },
      },
    })

    return NextResponse.json(novoAdmin, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao cadastrar administrador' }, { status: 500 })
  }
}