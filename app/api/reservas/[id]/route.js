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
    console.log("E-mail capturado pelo Mailtrap com sucesso!")
  } catch (error) {
    console.log("Erro ao enviar e-mail: ", error)
  }
}

export async function PUT(request, { params }) {
  const { response } = await autorizar('reservas')
  if (response) return response

  try {
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

    enviarNotificacao(emailMorador, status, nomeMorador)

    return NextResponse.json({ reservaAtualizada }, { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno ao processar a reserva' }, { status: 500 })
  }
}