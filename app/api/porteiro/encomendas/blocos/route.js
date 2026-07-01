import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { autorizar } from '@/lib/authorize';

export async function GET() {
  const { response } = await autorizar('encomendas');
  if (response) return response;

  try {
    const unidades = await prisma.unidade.findMany({
      select: {
        bloco: true,
      },
      orderBy: {
        bloco: 'asc',
      },
    });

    const blocos = [...new Set(unidades.map((unidade) => unidade.bloco).filter(Boolean))];

    return NextResponse.json(blocos);
  } catch (error) {
    console.error('Erro ao buscar blocos para encomendas:', error);
    return NextResponse.json({ message: 'Erro ao buscar blocos.' }, { status: 500 });
  }
}
