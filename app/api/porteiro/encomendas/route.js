import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const encomendas = await prisma.encomenda.findMany({
      include: {
        unidade: {
          include: {
            moradores: {
              include: { usuario: true }
            }
          }
        }
      },
      orderBy: { dataHoraChegada: 'desc' }
    });

    const formatadas = encomendas.map(enc => ({
      id: enc.id,
      apartamento: `Apto ${enc.unidade.numero}`,
      morador: enc.unidade.moradores[0]?.usuario.nome || "Sem morador",
      data: enc.dataHoraChegada,
      status: enc.status,
      remetente: enc.remetente,
      codigo: enc.codigoPacote
    }));

    return NextResponse.json(formatadas, { status: 200 });
  } catch (error) {
    console.error("Erro no GET:", error);
    return NextResponse.json({ message: "Erro ao listar." }, { status: 500 });
  }
}


export async function POST(request) {
  try {
    const body = await request.json();
    const { numUnidade, remetente, codigoPacote } = body;

    const unidade = await prisma.unidade.findFirst({
      where: { numero: numUnidade.toString() },
    });

    if (!unidade) {
      return NextResponse.json({ message: "Unidade não encontrada." }, { status: 404 });
    }

    const nova = await prisma.encomenda.create({
      data: {
        remetente,
        codigoPacote,
        unidadeId: unidade.id,
        status: "Aguardando Retirada",
      },
    });

    return NextResponse.json(nova, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: "Erro ao registrar." }, { status: 500 });
  }
}