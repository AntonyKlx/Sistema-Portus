import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { autorizar } from "@/lib/authorize";
import { criarBackupBanco, listarBackupsBanco } from "@/lib/databaseBackup.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const { response } = await autorizar("backups");
  if (response) return response;

  try {
    const backups = await listarBackupsBanco(prisma);
    return NextResponse.json(backups, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao buscar backups" }, { status: 500 });
  }
}

export async function POST() {
  const { response, session } = await autorizar("backups");
  if (response) return response;

  try {
    const backup = await criarBackupBanco(prisma, {
      solicitadoPor: session.user?.nome || session.user?.name || "Admin Master",
    });

    const status = backup.status === "Concluido" ? 201 : 500;
    return NextResponse.json(backup, { status });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao gerar backup" }, { status: 500 });
  }
}
