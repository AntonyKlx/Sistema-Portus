import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { enviarEmailNotificacao } from '@/lib/email';
import { autorizar } from '@/lib/authorize';
import { registrarLog } from '@/lib/log';

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
      bloco: enc.unidade.bloco,
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
  const { response, session } = await autorizar('encomendas');
  if (response) return response;

  try {
    const body = await request.json();
    const { bloco, numUnidade, remetente, codigoPacote } = body;

    const unidade = await prisma.unidade.findFirst({
      where: {
        bloco: bloco?.toString(),
        numero: numUnidade.toString(),
      },
      include: {
        moradores: {
          include: { usuario: true },
        },
      },
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

    void registrarLog(
      session.user.id,
      `Registrou encomenda de ${nova.remetente} para unidade ${unidade.numero}`
    );

    const emailMorador = unidade.moradores.find((morador) => morador.usuario?.email)?.usuario.email;

    if (emailMorador) {
      void enviarEmailNotificacao(emailMorador, {
        remetente: nova.remetente,
        codigoPacote: nova.codigoPacote,
        dataHoraChegada: nova.dataHoraChegada,
        numeroUnidade: unidade.numero,
      });
    } else {
      console.log(`Unidade ${unidade.numero} sem e-mail de morador cadastrado para notificacao de encomenda.`);
    }

    return NextResponse.json(nova, { status: 201 });
  } catch (error) {
    console.error("Erro no POST de encomendas:", error);
    return NextResponse.json({ message: "Erro ao registrar." }, { status: 500 });
  }
}
