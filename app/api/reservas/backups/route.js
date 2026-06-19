import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { criarBackupReservas, listarBackupsReservas } from "@/lib/reservaBackup.mjs";

export async function GET() {
  try {
    const backups = await listarBackupsReservas(prisma);
    return NextResponse.json(backups, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao buscar backups de reservas" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json().catch(() => ({}));
    const backup = await criarBackupReservas(prisma, {
      solicitadoPor: data.solicitadoPor,
    });

    return NextResponse.json(backup, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao gerar backup de reservas" }, { status: 500 });
  }
}
