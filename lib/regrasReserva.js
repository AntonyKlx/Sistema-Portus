function converterNumeroInteiro(valor) {
  const numero = Number(valor)
  if (!Number.isInteger(numero)) return null
  return numero
}

function converterHorario(valor) {
  if (!valor || typeof valor !== 'string') return null

  const partes = valor.match(/^(\d{2}):(\d{2})$/)
  if (!partes) return null

  const hora = Number(partes[1])
  const minuto = Number(partes[2])

  if (hora < 0 || hora > 23 || minuto < 0 || minuto > 59) return null

  return new Date(Date.UTC(2000, 0, 1, hora, minuto, 0))
}

function minutosDoHorario(data) {
  return data.getUTCHours() * 60 + data.getUTCMinutes()
}

export function validarDadosRegras(data) {
  const antecedenciaMinimaReserva = converterNumeroInteiro(data.antecedenciaMinimaReserva)
  const antecedenciaMinCancelamento = converterNumeroInteiro(data.antecedenciaMinCancelamento)
  const limiteReservasAtivas = converterNumeroInteiro(data.limiteReservasAtivas)
  const duracaoReserva = data.duracaoReserva === undefined || data.duracaoReserva === ''
    ? 4
    : converterNumeroInteiro(data.duracaoReserva)
  const horarioPermitidoInicio = converterHorario(data.horarioPermitidoInicio)
  const horarioPermitidoFim = converterHorario(data.horarioPermitidoFim)

  if (
    antecedenciaMinimaReserva === null ||
    antecedenciaMinCancelamento === null ||
    limiteReservasAtivas === null ||
    duracaoReserva === null ||
    antecedenciaMinimaReserva <= 0 ||
    antecedenciaMinCancelamento <= 0 ||
    limiteReservasAtivas <= 0 ||
    duracaoReserva <= 0
  ) {
    return { error: 'Todos os campos numericos devem ser maiores que zero.' }
  }

  if (!horarioPermitidoInicio || !horarioPermitidoFim) {
    return { error: 'Os horarios permitidos de inicio e fim sao obrigatorios.' }
  }

  if (minutosDoHorario(horarioPermitidoFim) <= minutosDoHorario(horarioPermitidoInicio)) {
    return { error: 'O horario permitido de fim deve ser maior que o horario de inicio.' }
  }

  return {
    dados: {
      antecedenciaMinimaReserva,
      antecedenciaMinCancelamento,
      limiteReservasAtivas,
      duracaoReserva,
      horarioPermitidoInicio,
      horarioPermitidoFim,
    },
  }
}
