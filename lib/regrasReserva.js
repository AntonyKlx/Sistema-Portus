export function validarDadosRegras(data) {
  const antecedenciaMinimaReserva = converterNumeroInteiro(data.antecedenciaMinimaReserva)
  const antecedenciaMinCancelamento = converterNumeroInteiro(data.antecedenciaMinCancelamento)
  const limiteReservasAtivas = converterNumeroInteiro(data.limiteReservasAtivas)
  const duracaoReserva = converterNumeroInteiro(data.duracaoReserva) // 1. Adicionado
  const horarioPermitidoInicio = converterHorario(data.horarioPermitidoInicio)
  const horarioPermitidoFim = converterHorario(data.horarioPermitidoFim)

  if (
    !antecedenciaMinimaReserva ||
    !antecedenciaMinCancelamento ||
    !limiteReservasAtivas ||
    !duracaoReserva ||
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