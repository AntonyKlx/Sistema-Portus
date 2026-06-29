import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const areas = await prisma.areaComum.findMany({
      select: {
        id: true,
        nome: true
      }
    });
    return NextResponse.json(areas, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar áreas' }, { status: 500 });
  }
}