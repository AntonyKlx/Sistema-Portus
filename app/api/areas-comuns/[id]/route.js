import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { autorizar } from '@/lib/authorize'

export async function DELETE(request, { params }) {
  const { response } = await autorizar('areas-comuns')
  if (response) return response

  try {
    const id = Number(params.id)
    //validar id pra não dar cagada
    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    const existeAreaComum = await prisma.areaComum.findUnique({
      where: { id: id }
    })
    if (!existeAreaComum) return NextResponse.json({ error: 'Área comum não existe' }, { status: 404 })

    const existeReservaAtiva = await prisma.reserva.findFirst({
      where: {
        areaComumId: id,
        status: { in: ['Pendente', 'Aprovada'] } // tomar cuidado aqui por que pode mudar de acordo com o que a gente definir mais pra frente
      }
    })

    const url = new URL(request.url);
    const confirmou = url.searchParams.get('confirmar') === 'true';

    if (existeReservaAtiva && !confirmou) return NextResponse.json({ error: 'Existem reservas pendentes para essa área comum. Confirma a exclusão?' }, { status: 409 })

    await prisma.reserva.deleteMany({
      where: { areaComumId: id }
    })

    await prisma.regrasReserva.deleteMany({
      where: { areaComumId: id }
    })

    await prisma.areaComum.delete({
      where: { id: id }
    })

    return NextResponse.json({ message: 'Área comum deletada com sucesso' }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao deletar a área comum' }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
  const { response } = await autorizar('areas-comuns')
  if (response) return response

  try {
    const id = Number(params.id)
    //validar id pra não dar cagada
    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    const existeAreaComum = await prisma.areaComum.findUnique({
      where: { id: id }
    })
    if (!existeAreaComum) return NextResponse.json({ error: 'Área comum não existe' }, { status: 404 })

    const data = await request.json()
    const { nome, descricao } = data;

    if (!nome) return NextResponse.json({ error: 'Todos os campos são obrigatórios.' }, { status: 400 });

    const areaExistente = await prisma.areaComum.findFirst({
      where: {
        id: { not: id },
        nome
      }
    });

    if (areaExistente) return NextResponse.json({ error: 'Já existe uma área comum com esse nome' }, { status: 409 })

    const areaAtualizada = await prisma.areaComum.update({
      where: { id: id },
      data: {
        nome,
        descricao
      }
    })
    return NextResponse.json(areaAtualizada, { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao atualizar área comum' }, { status: 500 });
  }
}