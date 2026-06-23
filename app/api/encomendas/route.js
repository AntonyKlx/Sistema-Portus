import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const encomendas = await prisma.encomenda.findMany({
      include: {
        unidade: {
          include: {
            moradores: {
              include: {
                usuario: true // Para pegar o nome do morador
              }
            }
          }
        }
      },
      orderBy: {
        dataHoraChegada: 'desc' // As mais recentes primeiro
      }
    });

    const formatadas = encomendas.map(enc => ({
      id: enc.id,
      apartamento: `Apto ${enc.unidade.numero}`,
      bloco: enc.unidade.bloco,
      // Pega o nome do primeiro morador vinculado a unidade
      morador: enc.unidade.moradores[0]?.usuario.nome || "Unidade Vazia",
      data: enc.dataHoraChegada,
      status: enc.status,
      remetente: enc.remetente,
      codigo: enc.codigoPacote
    }));

    return NextResponse.json(formatadas, { status: 200 });
  } catch (error) {
    console.error("Erro ao buscar encomendas:", error);
    return NextResponse.json({ message: "Erro ao carregar lista." }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { numUnidade, remetente, codigoPacote } = body;

    // Validação de campos obrigatórios
    if (!numUnidade || !remetente || !codigoPacote) {
      return NextResponse.json(
        { message: "Todos os campos são obrigatórios." },
        { status: 400 }
      );
    }

    // Buscar a unidade pelo NÚMERO
    const unidade = await prisma.unidade.findFirst({
      where: { numero: numUnidade.toString() },
    });

    // Se a unidade não existir
    if (!unidade) {
      return NextResponse.json(
        { message: `A unidade ${numUnidade} não foi encontrada. Verifique o número.` },
        { status: 404 }
      );
    }

    // Salvar a encomenda
    const novaEncomenda = await prisma.encomenda.create({
      data: {
        remetente,
        codigoPacote,
        unidadeId: unidade.id,
        status: "Aguardando Retirada",
      },
    });

    return NextResponse.json(
      { message: "Encomenda registrada com sucesso!", encomenda: novaEncomenda },
      { status: 201 }
    );

  } catch (error) {
    console.error("Erro no registro:", error);
    return NextResponse.json(
      { message: "Erro interno ao registrar encomenda." },
      { status: 500 }
    );
  }
}