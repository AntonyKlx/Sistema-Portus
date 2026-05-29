import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const unidades = await prisma.unidade.findMany();
    return NextResponse.json(unidades);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar unidades' }, { status: 500 });
  }
}

export async function POST(request) {
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