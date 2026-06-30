import { prisma } from '@/lib/prisma'

export async function registrarLog(usuarioId, acaoExecutada) {
  try {
    const id = Number(usuarioId)

    if (!Number.isInteger(id) || id <= 0 || !acaoExecutada) {
      return
    }

    await prisma.logAcesso.create({
      data: {
        usuarioId: id,
        acaoExecutada,
      },
    })
  } catch (error) {
    console.error('Erro ao registrar log de acesso:', error)
  }
}
