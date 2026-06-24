import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { autorizar } from '@/lib/authorize'

export async function GET() {
  const { response } = await autorizar('unidades')
  if (response) return response

  try {
    const unidades = await prisma.unidade.findMany({
      include: {
        moradores: {
          select: {
            id: true,
            usuario: {
              select: {
                nome: true,
              },
            },
          },
        },
      },
      orderBy: [
        { bloco: 'asc' },
        { andar: 'asc' },
        { numero: 'asc' },
      ],
    });
    return NextResponse.json(unidades);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar unidades' }, { status: 500 });
  }
}

export async function POST(request) {
  const { response } = await autorizar('unidades')
  if (response) return response

  try {
    //recebe os dados 
    const data = await request.json();
    const { bloco, andar, numero } = data;

    if (!bloco || !andar || !numero) {
      return NextResponse.json({ error: 'Todos os campos são obrigatórios' }, { status: 400 });
    }

    //evitar unidade duplicada
    const unidadeExistente = await prisma.unidade.findFirst({
      where: {
        bloco,
        andar: parseInt(andar),
        numero,
      },
    });
    if (unidadeExistente) {
      return NextResponse.json({ error: 'Unidade já cadastrada' }, { status: 400 });
    }

    const novaUnidade = await prisma.unidade.create({
      data: {
        bloco,
        andar: parseInt(andar),
        numero,
      },
    });
    return NextResponse.json(novaUnidade, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao cadastrar unidade' }, { status: 500 });
  }
}
