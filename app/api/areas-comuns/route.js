import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { autorizar } from '@/lib/authorize'

export async function GET() {
  const { response } = await autorizar('reservas')
  if (response) return response

  try {
    const areas = await prisma.areaComum.findMany({
      include: {
        regras: true,
        reservas: {
          select: {
            id: true,
            dataHora: true,
            status: true,
          },
          orderBy: {
            dataHora: 'asc',
          },
        },
      },
      orderBy: {
        nome: 'asc',
      },
    });
    return NextResponse.json(areas);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar áreas comuns' }, { status: 500 });
  }
}

export async function POST(request) {
  const { response } = await autorizar('areas-comuns')
  if (response) return response

  try {
    const data = await request.json();
    const { nome, descricao } = data;

    if (!nome) return NextResponse.json({ error: 'Todos os campos são obrigatórios.' }, { status: 400 });

    const areaExistente = await prisma.areaComum.findUnique({
      where: { nome }
    });

    if (areaExistente) return NextResponse.json({ error: 'Já existe uma área comum com esse nome' }, { status: 400 })

    const novaArea = await prisma.areaComum.create({
      data: { nome, descricao }
    })

    return NextResponse.json(novaArea, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao criar área comum' }, { status: 500 })
  }
}
