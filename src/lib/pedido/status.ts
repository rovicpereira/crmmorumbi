export type PedidoStatus = {
  expedicaoConfirmada: boolean;
  clienteConfirmouData: boolean;
  faturado: boolean;
  baixadoCaixa: boolean;
  entregaAgendada: boolean;
  cancelado: boolean;
};

export function statusAtualPedido(pedido: PedidoStatus): string {
  if (pedido.cancelado) return "Cancelado";
  if (!pedido.expedicaoConfirmada) return "Aguardando expedição";
  if (!pedido.clienteConfirmouData) return "Aguardando confirmação do cliente";
  if (!pedido.faturado) return "Aguardando faturamento";
  if (!pedido.baixadoCaixa) return "Aguardando baixa no caixa";
  if (!pedido.entregaAgendada) return "Aguardando agendamento de entrega";
  return "Concluído";
}
