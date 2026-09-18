"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { temAcessoCRM } from "@/lib/permissoes";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

async function exigirAcessoCRM() {
  const session = await getServerSession(authOptions);
  if (!temAcessoCRM(session?.user?.papel)) {
    throw new Error("Sem permissão para gerenciar pedidos.");
  }
}

export type EtapaPedido =
  | "expedicaoConfirmada"
  | "clienteConfirmouData"
  | "faturado"
  | "baixadoCaixa"
  | "entregaAgendada";

// Ordem fixa do checklist — não dá pra marcar uma etapa sem a anterior estar
// concluída primeiro. É a mesma trava que o futuro agente de IA vai respeitar
// (nunca confirmar data de entrega com o cliente antes da expedição confirmar).
const ORDEM_ETAPAS: EtapaPedido[] = [
  "expedicaoConfirmada",
  "clienteConfirmouData",
  "faturado",
  "baixadoCaixa",
  "entregaAgendada",
];

const ROTULOS_ETAPA: Record<EtapaPedido, string> = {
  expedicaoConfirmada: "Expedição confirmou disponibilidade",
  clienteConfirmouData: "Cliente confirmou a data",
  faturado: "Faturado no ERP",
  baixadoCaixa: "Baixado no caixa",
  entregaAgendada: "Entrega agendada",
};

export async function converterOrcamentoEmPedido(orcamentoId: string) {
  await exigirAcessoCRM();

  const existente = await db.pedido.findUnique({ where: { orcamentoId } });
  if (existente) {
    return { id: existente.id, numero: existente.numero };
  }

  const pedido = await db.pedido.create({ data: { orcamentoId } });

  revalidatePath("/pedidos");
  return { id: pedido.id, numero: pedido.numero };
}

export async function marcarEtapaPedido(pedidoId: string, etapa: EtapaPedido, dataEntregaCombinada?: string) {
  await exigirAcessoCRM();

  const pedido = await db.pedido.findUnique({ where: { id: pedidoId } });
  if (!pedido) {
    throw new Error("Pedido não encontrado.");
  }

  const indiceEtapa = ORDEM_ETAPAS.indexOf(etapa);
  const etapaAnterior = ORDEM_ETAPAS[indiceEtapa - 1];

  if (etapaAnterior && !pedido[etapaAnterior]) {
    throw new Error(
      `Não é possível marcar "${ROTULOS_ETAPA[etapa]}" antes de "${ROTULOS_ETAPA[etapaAnterior]}".`
    );
  }

  if (etapa === "clienteConfirmouData" && !dataEntregaCombinada) {
    throw new Error("Informe a data de entrega combinada com o cliente.");
  }

  await db.pedido.update({
    where: { id: pedidoId },
    data: {
      [etapa]: true,
      [`${etapa}Em`]: new Date(),
      ...(etapa === "clienteConfirmouData" && dataEntregaCombinada
        ? { dataEntregaCombinada: new Date(dataEntregaCombinada) }
        : {}),
    },
  });

  revalidatePath(`/pedidos/${pedidoId}`);
  revalidatePath("/pedidos");
}

export async function desmarcarEtapaPedido(pedidoId: string, etapa: EtapaPedido) {
  await exigirAcessoCRM();

  const pedido = await db.pedido.findUnique({ where: { id: pedidoId } });
  if (!pedido) {
    throw new Error("Pedido não encontrado.");
  }

  const indiceEtapa = ORDEM_ETAPAS.indexOf(etapa);
  const proximaEtapa = ORDEM_ETAPAS[indiceEtapa + 1];

  if (proximaEtapa && pedido[proximaEtapa]) {
    throw new Error(
      `Não é possível desmarcar "${ROTULOS_ETAPA[etapa]}" enquanto "${ROTULOS_ETAPA[proximaEtapa]}" já estiver concluída.`
    );
  }

  await db.pedido.update({
    where: { id: pedidoId },
    data: { [etapa]: false, [`${etapa}Em`]: null },
  });

  revalidatePath(`/pedidos/${pedidoId}`);
  revalidatePath("/pedidos");
}

export async function cancelarPedido(pedidoId: string, observacoes?: string) {
  await exigirAcessoCRM();

  await db.pedido.update({
    where: { id: pedidoId },
    data: { cancelado: true, observacoes },
  });

  revalidatePath(`/pedidos/${pedidoId}`);
  revalidatePath("/pedidos");
}
