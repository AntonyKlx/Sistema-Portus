import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(request, { params }) {
  try {
    const { id } = params;
    const { nomeRetirante } = await request.json();

    // 1. Validação simples (RNF08)
    if (!nomeRetirante || nomeRetirante.trim() === "") {
      return NextResponse.json(
        { message: "Por favor, informe o nome de quem está retirando o pacote." },
        { status: 400 }
      );
    }

    // 2. Atualizar a encomenda no banco
    const encomendaAtualizada = await prisma.encomenda.update({
      where: { id: parseInt(id) },
      data: {
        status: "Retirada",
        nomeRetirante: nomeRetirante,
        dataHoraRetirada: new Date(),
      },
    });

    return NextResponse.json(
      { message: "Baixa realizada com sucesso!", encomenda: encomendaAtualizada },
      { status: 200 }
    );

  } catch (error) {
    console.error("Erro ao dar baixa na encomenda:", error);
    return NextResponse.json(
      { message: "Ocorreu um erro ao processar a baixa. Verifique se a encomenda existe." },
      { status: 500 }
    );
  }
}