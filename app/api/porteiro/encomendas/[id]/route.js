import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { autorizar } from '@/lib/authorize';
import { registrarLog } from '@/lib/log';

export async function PATCH(request, { params }) {
  const { response, session } = await autorizar('encomendas');
  if (response) return response;

  try {
    const resolvedParams = await params;
    const id = resolvedParams.id;
    const { nomeRetirante } = await request.json();

    const encomendaAtualizada = await prisma.encomenda.update({
      where: { id: parseInt(id) },
      data: {
        status: "Retirada",
        nomeRetirante: nomeRetirante,
        dataHoraRetirada: new Date(),
      },
    });

    void registrarLog(
      session.user.id,
      `Deu baixa na encomenda de ${encomendaAtualizada.remetente}`
    );

    return NextResponse.json(encomendaAtualizada, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Erro ao atualizar status." }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  const { response } = await autorizar('encomendas');
  if (response) return response;

  try {
    const { id } = await params;
    const body = await request.json();
    const { bloco, numUnidade, remetente, codigoPacote } = body;

    // Validar se existe
    const unidade = await prisma.unidade.findFirst({
      where: {
        bloco: bloco?.toString(),
        numero: numUnidade.toString(),
      },
    });

    if (!unidade) {
      return NextResponse.json(
        { message: `A unidade ${numUnidade} não existe.` }, 
        { status: 404 }
      );
    }

    //Atualizar os dados no banco
    const encomendaEditada = await prisma.encomenda.update({
      where: { id: parseInt(id) },
      data: {
        remetente,
        codigoPacote,
        unidadeId: unidade.id,
      },
    });

    return NextResponse.json(encomendaEditada, { status: 200 });
  } catch (error) {
    console.error("Erro na edição:", error);
    return NextResponse.json(
      { message: "Erro ao salvar as alterações." }, 
      { status: 500 }
    );
  }
}
