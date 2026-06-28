export function converterNumeroInteiro(valor) {
  const numero = Number(valor)
  return Number.isInteger(numero) ? numero : null
}

export function converterHorario(valor) {
  if (!valor) return null

  if (typeof valor === 'string' && /^\d{2}:\d{2}$/.test(valor)) {
    return new Date(`2000-01-01T${valor}:00.000Z`)
  }

  const data = new Date(valor)
  return Number.isNaN(data.getTime()) ? null : data
}

export function minutosDoDia(data) {
  return data.getUTCHours() * 60 + data.getUTCMinutes()
}

export function validarDadosRegras(data) {
  const antecedenciaMinimaReserva = converterNumeroInteiro(data.antecedenciaMinimaReserva)
  const antecedenciaMinCancelamento = converterNumeroInteiro(data.antecedenciaMinCancelamento)
  const limiteReservasAtivas = converterNumeroInteiro(data.limiteReservasAtivas)
  const horarioPermitidoInicio = converterHorario(data.horarioPermitidoInicio)
  const horarioPermitidoFim = converterHorario(data.horarioPermitidoFim)

  if (
    !antecedenciaMinimaReserva ||
    !antecedenciaMinCancelamento ||
    !limiteReservasAtivas ||
    antecedenciaMinimaReserva <= 0 ||
    antecedenciaMinCancelamento <= 0 ||
    limiteReservasAtivas <= 0
  ) {
    return { error: 'Todos os campos numericos devem ser maiores que zero.' }
  }

  if (!horarioPermitidoInicio || !horarioPermitidoFim) {
    return { error: 'Os horarios permitidos de inicio e fim sao obrigatorios.' }
  }

  return {
    dados: {
      antecedenciaMinimaReserva,
      antecedenciaMinCancelamento,
      limiteReservasAtivas,
      horarioPermitidoInicio,
      horarioPermitidoFim,
    },
  }
}
