import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

function formatarDataHora(data) {
  if (!data) return '-'

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(data))
}

export async function enviarEmailNotificacao(emailMorador, dadosPacote) {
  try {
    const remetente = dadosPacote?.remetente || '-'
    const codigoPacote = dadosPacote?.codigoPacote || '-'
    const dataHoraChegada = formatarDataHora(dadosPacote?.dataHoraChegada)
    const numeroUnidade = dadosPacote?.numeroUnidade || '-'

    await transporter.sendMail({
      from: process.env.SMTP_FROM || `"Sistema Portus" <${process.env.SMTP_USER}>`,
      to: emailMorador,
      subject: 'Nova encomenda recebida',
      text: [
        'Uma nova encomenda chegou para sua unidade.',
        '',
        `Remetente: ${remetente}`,
        `Codigo do pacote: ${codigoPacote}`,
        `Data/hora de chegada: ${dataHoraChegada}`,
        `Unidade: ${numeroUnidade}`,
      ].join('\n'),
    })
  } catch (error) {
    console.error('Erro ao enviar e-mail de notificacao de encomenda:', error)
  }
}
