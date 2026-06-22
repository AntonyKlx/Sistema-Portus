import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { autorizar } from '@/lib/authorize'

const PERFIS_ADMIN = ['administrador', 'adminMaster']

export async function GET(request, { params: paramsPromise }) {
  const { response } = await autorizar('admins')
  if (response) return response

  try {
    const params = await paramsPromise
    const id = Number(params.id)
    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    const admin = await prisma.usuario.findFirst({
      where: { id, perfil: { nome: { in: PERFIS_ADMIN } } },
      select: {
        id: true,
        nome: true,
        email: true,
        ativo: true,
        criadoEm: true,
        perfil: { select: { id: true, nome: true } },
      },
    })

    if (!admin) {
      return NextResponse.json({ error: 'Administrador não encontrado' }, { status: 404 })
    }

    return NextResponse.json(admin)
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar administrador' }, { status: 500 })
  }
}

export async function PUT(request, { params: paramsPromise }) {
  const { response, session } = await autorizar('admins')
  if (response) return response

  try {
    const params = await paramsPromise
    const id = Number(params.id)
    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    const admin = await prisma.usuario.findFirst({
      where: { id, perfil: { nome: { in: PERFIS_ADMIN } } },
    })
    if (!admin) {
      return NextResponse.json({ error: 'Administrador não encontrado' }, { status: 404 })
    }

    const data = await request.json()
    const { nome, email, senha, nivel, ativo } = data

    if (!nome || !email || !nivel) {
      return NextResponse.json(
        { error: 'Nome, e-mail e nível de permissão são obrigatórios' },
        { status: 400 }
      )
    }

    if (!PERFIS_ADMIN.includes(nivel)) {
      return NextResponse.json(
        { error: 'Nível de permissão inválido. Use "administrador" ou "adminMaster".' },
        { status: 400 }
      )
    }

    // Impede que o Admin Master se rebaixe ou desative a própria conta (RF19, FA2)
    const ehProprioUsuario = Number(session.user.id) === id
    const perfilAtual = await prisma.perfilAcesso.findUnique({ where: { id: admin.perfilId } })

    if (ehProprioUsuario && perfilAtual?.nome === 'adminMaster' && nivel !== 'adminMaster') {
      return NextResponse.json(
        { error: 'Você não pode rebaixar o nível de permissão da própria conta.' },
        { status: 403 }
      )
    }

    const emailExistente = await prisma.usuario.findFirst({
      where: { email, id: { not: id } },
    })
    if (emailExistente) {
      return NextResponse.json({ error: 'E-mail já cadastrado para outro usuário' }, { status: 409 })
    }

    const perfil = await prisma.perfilAcesso.findFirst({ where: { nome: nivel } })
    if (!perfil) {
      return NextResponse.json({ error: 'Perfil de acesso não encontrado' }, { status: 500 })
    }

    if (ehProprioUsuario && ativo === false) {
      return NextResponse.json(
        { error: 'Você não pode desativar a própria conta.' },
        { status: 403 }
      )
    }

    const updateData = {
      nome,
      email,
      perfilId: perfil.id,
      ativo: ativo ?? admin.ativo,
    }

    if (senha && senha.trim()) {
      updateData.senha = await bcrypt.hash(senha, 10)
    }

    const adminAtualizado = await prisma.usuario.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        nome: true,
        email: true,
        ativo: true,
        criadoEm: true,
        perfil: { select: { id: true, nome: true } },
      },
    })

    return NextResponse.json(adminAtualizado, { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao atualizar administrador' }, { status: 500 })
  }
}

export async function DELETE(request, { params: paramsPromise }) {
  const { response, session } = await autorizar('admins')
  if (response) return response

  try {
    const params = await paramsPromise
    const id = Number(params.id)
    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    // RF19, FA2 — Admin Master não pode remover a própria conta
    if (Number(session.user.id) === id) {
      return NextResponse.json(
        { error: 'Você não pode remover sua própria conta de administrador.' },
        { status: 403 }
      )
    }

    const admin = await prisma.usuario.findFirst({
      where: { id, perfil: { nome: { in: PERFIS_ADMIN } } },
    })
    if (!admin) {
      return NextResponse.json({ error: 'Administrador não encontrado' }, { status: 404 })
    }

    await prisma.usuario.delete({ where: { id } })

    return NextResponse.json({ message: 'Administrador removido com sucesso' }, { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao remover administrador' }, { status: 500 })
  }
}