import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { autorizar } from '@/lib/authorize'
import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: "sandbox.smtp.mailtrap.io",
  port: 2525,
  auth: {
    user: process.env.MAILTRAP_USER,
    pass: process.env.MAILTRAP_PASS
  }
})

async function enviarNotificacao(emailDestino, status, nome) {
  try {
    const mensagemHtml = status === 'Aprovada'
      ? `<p>Olá <b>${nome}</b>, sua reserva foi aprovada!</p>`
      : `<p>Olá <b>${nome}</b>, infelizmente sua reserva foi reprovada.</p>`;

    await transporter.sendMail({
      from: '"Sistema Portus" <nao-responda@portus.com>',
      to: emailDestino,
      subject: `Atualização da sua reserva: ${status}`,
      html: mensagemHtml
    })
    return true
  } catch (error) {
    console.log("Erro ao enviar e-mail: ", error)
    return false
  }
}

export async function PUT(request, { params: paramsPromise }) {
  const { response, session } = await autorizar('reservas')
  if (response) return response

  if (!['sindico', 'administrador', 'adminMaster'].includes(session.user.perfil)) {
    return NextResponse.json({ error: 'Apenas gestores podem avaliar reservas.' }, { status: 403 })
  }

  try {
    const params = await paramsPromise
    const id = Number(params.id)

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    const data = await request.json()
    const { status, justificativa } = data;

    if (status !== 'Aprovada' && status !== 'Reprovada') {
      return NextResponse.json({ error: 'Status inválido' }, { status: 400 })
    }

    //vejo se existe reserva e já trago infos do usuário para envio de email posterior
    const existeReserva = await prisma.reserva.findUnique({
      where: { id: id },
      include: {
        morador: {
          include: {
            usuario: true
          }
        }
      }
    })

    if (!existeReserva) {
      return NextResponse.json({ error: 'A reserva com esse ID não existe' }, { status: 404 })
    }

    // só permitir avaliar reservas que estão pendentes
    if (existeReserva.status !== 'Pendente') {
      return NextResponse.json({ error: 'Esta reserva já foi avaliada anteriormente.' }, { status: 409 })
    }

    const emailMorador = existeReserva.morador.usuario.email
    const nomeMorador = existeReserva.morador.usuario.nome

    const reservaAtualizada = await prisma.reserva.update({
      where: { id: id },
      data: {
        status,
        justificativa
      }
    })

    const emailEnviado = await enviarNotificacao(emailMorador, status, nomeMorador)

    return NextResponse.json({ reservaAtualizada, emailEnviado }, { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno ao processar a reserva' }, { status: 500 })
  }
}

// RF11 — Cancelar Reserva
export async function DELETE(request, { params: paramsPromise }) {
  const { response, session } = await autorizar('reservas')
  if (response) return response

  try {
    const params = await paramsPromise
    const id = Number(params.id)

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    const reserva = await prisma.reserva.findUnique({
      where: { id },
      include: {
        morador: { include: { usuario: true } },
        areaComum: { include: { regras: true } },
      },
    })

    if (!reserva) {
      return NextResponse.json({ error: 'A reserva com esse ID não existe' }, { status: 404 })
    }

    // O morador só pode cancelar a própria reserva. Síndico/administrador/adminMaster podem cancelar qualquer uma.
    const perfilUsuario = session.user.perfil
    const ehGestor = ['sindico', 'administrador', 'adminMaster'].includes(perfilUsuario)

    if (!ehGestor && reserva.morador.usuarioId !== Number(session.user.id)) {
      return NextResponse.json(
        { error: 'Você só pode cancelar suas próprias reservas.' },
        { status: 403 }
      )
    }

    // Apenas reservas Pendentes ou Aprovadas podem ser canceladas
    if (!['Pendente', 'Aprovada'].includes(reserva.status)) {
      return NextResponse.json(
        { error: 'Apenas reservas pendentes ou aprovadas podem ser canceladas.' },
        { status: 409 }
      )
    }

    // Valida a antecedência mínima de cancelamento configurada para a área (RF11 / RF12)
    // O síndico/administrador pode cancelar fora do prazo; o morador, não.
    const regras = reserva.areaComum.regras
    if (!ehGestor && regras) {
      const horasAteReserva = (new Date(reserva.dataHora).getTime() - Date.now()) / (1000 * 60 * 60)

      if (horasAteReserva < regras.antecedenciaMinCancelamento) {
        return NextResponse.json(
          {
            error: `Cancelamento fora do prazo. É necessário cancelar com pelo menos ${regras.antecedenciaMinCancelamento}h de antecedência. Contate o síndico.`,
          },
          { status: 409 }
        )
      }
    }

    const reservaCancelada = await prisma.reserva.update({
      where: { id },
      data: { status: 'Cancelada' },
    })

    return NextResponse.json({ reservaCancelada }, { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno ao cancelar a reserva' }, { status: 500 })
  }
}
