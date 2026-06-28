import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { autorizar } from '@/lib/authorize'

export async function GET(request, { params: paramsPromise }) {
  const { response } = await autorizar('moradores')
  if (response) return response

  try {
    const params = await paramsPromise
    const id = Number(params.id)
    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    const morador = await prisma.morador.findUnique({
      where: { id },
      include: {
        usuario: { select: { id: true, nome: true, email: true, ativo: true } },
        unidade: { select: { id: true, bloco: true, andar: true, numero: true } },
      },
    })

    if (!morador) {
      return NextResponse.json({ error: 'Morador não encontrado' }, { status: 404 })
    }

    return NextResponse.json(morador)
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar morador' }, { status: 500 })
  }
}

export async function PUT(request, { params: paramsPromise }) {
  const { response } = await autorizar('moradores')
  if (response) return response

  try {
    const params = await paramsPromise
    const id = Number(params.id)
    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    const morador = await prisma.morador.findUnique({
      where: { id },
      include: { usuario: true },
    })
    if (!morador) {
      return NextResponse.json({ error: 'Morador não encontrado' }, { status: 404 })
    }

    const data = await request.json()
    const { nome, email, telefone, unidadeId, inadimplente, ativo } = data

    if (!nome || !email || !telefone || !unidadeId) {
      return NextResponse.json({ error: 'Todos os campos obrigatórios devem ser preenchidos' }, { status: 400 })
    }

    const emailExistente = await prisma.usuario.findFirst({
      where: { email, id: { not: morador.usuarioId } },
    })
    if (emailExistente) {
      return NextResponse.json({ error: 'E-mail já cadastrado para outro usuário' }, { status: 409 })
    }

    const unidade = await prisma.unidade.findUnique({ where: { id: parseInt(unidadeId) } })
    if (!unidade) {
      return NextResponse.json({ error: 'Unidade não encontrada' }, { status: 404 })
    }

    const resultado = await prisma.$transaction(async (tx) => {
      await tx.usuario.update({
        where: { id: morador.usuarioId },
        data: { nome, email, ativo: ativo ?? morador.usuario.ativo },
      })

      return tx.morador.update({
        where: { id },
        data: {
          telefone,
          inadimplente: inadimplente ?? morador.inadimplente,
          unidadeId: parseInt(unidadeId),
        },
        include: {
          usuario: { select: { id: true, nome: true, email: true, ativo: true } },
          unidade: { select: { id: true, bloco: true, andar: true, numero: true } },
        },
      })
    })

    return NextResponse.json(resultado, { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao atualizar morador' }, { status: 500 })
  }
}

export async function DELETE(request, { params: paramsPromise }) {
  const { response } = await autorizar('moradores')
  if (response) return response

  try {
    const params = await paramsPromise
    const id = Number(params.id)
    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    const morador = await prisma.morador.findUnique({ where: { id } })
    if (!morador) {
      return NextResponse.json({ error: 'Morador não encontrado' }, { status: 404 })
    }

    const reservasAtivas = await prisma.reserva.findFirst({
      where: { moradorId: id, status: { in: ['pendente', 'aprovada'] } },
    })
    if (reservasAtivas) {
      return NextResponse.json(
        { error: 'Não é possível remover o morador pois ele possui reservas ativas.' },
        { status: 409 }
      )
    }

    await prisma.$transaction(async (tx) => {
      await tx.morador.delete({ where: { id } })
      await tx.usuario.delete({ where: { id: morador.usuarioId } })
    })

    return NextResponse.json({ message: 'Morador removido com sucesso' }, { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao remover morador' }, { status: 500 })
  }
}