import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const TIME_ZONE = 'America/Sao_Paulo';

function getHoraNoFuso(data) {
  const partes = new Intl.DateTimeFormat('pt-BR', {
    timeZone: TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(data));

  return Number(partes.find((parte) => parte.type === 'hour')?.value);
}

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const dataBusca = searchParams.get('data'); // formato YYYY-MM-DD

    if (!dataBusca) {
      return NextResponse.json(
        { error: 'Informe a data para verificar a disponibilidade.' },
        { status: 400 }
      );
    }

    const areaComumId = parseInt(id);

    // Busca as regras da área comum
    const areaComum = await prisma.areaComum.findUnique({
      where: { id: areaComumId },
      include: { regras: true },
    });

    if (!areaComum) {
      return NextResponse.json(
        { error: 'Área comum não encontrada.' },
        { status: 404 }
      );
    }

    if (!areaComum.regras) {
      return NextResponse.json(
        { error: 'Esta área comum ainda não possui regras de reserva configuradas.' },
        { status: 400 }
      );
    }

    const { horarioPermitidoInicio, horarioPermitidoFim } = areaComum.regras;

    // Gera a lista de horários permitidos de hora em hora
    const horaInicio = getHoraNoFuso(horarioPermitidoInicio);
    let horaFim = getHoraNoFuso(horarioPermitidoFim);
    if (horaFim === 0) { // Trata o caso de terminar à meia-noite
        horaFim = 24;
    }

    const todosHorarios = [];
    for (let hora = horaInicio; hora < horaFim; hora++) {
      todosHorarios.push(`${String(hora).padStart(2, '0')}:00`);
    }

    // Busca as reservas já aprovadas/pendentes da área naquele dia
    const inicioDoDia = new Date(`${dataBusca}T00:00:00.000-03:00`); // Considera o fuso de SP
    const fimDoDia = new Date(`${dataBusca}T23:59:59.999-03:00`);

    const reservasExistentes = await prisma.reserva.findMany({
      where: {
        areaComumId,
        status: { in: ['Pendente', 'Aprovada'] },
        dataHora: {
          gte: inicioDoDia,
          lte: fimDoDia,
        },
      },
      select: {
        dataHora: true,
      },
    });

    const horariosOcupados = reservasExistentes.map((reserva) => {
      return `${String(getHoraNoFuso(reserva.dataHora)).padStart(2, '0')}:00`;
    });

    // Remove os horários ocupados da lista de horários permitidos
    const horariosDisponiveis = todosHorarios.filter(
      (horario) => !horariosOcupados.includes(horario)
    );

    return NextResponse.json(
      {
        horariosDisponiveis,
        semHorarios: horariosDisponiveis.length === 0,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erro na API de disponibilidade:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar horários disponíveis.' },
      { status: 500 }
    );
  }
}