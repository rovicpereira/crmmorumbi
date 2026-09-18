"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { temAcessoCRM } from "@/lib/permissoes";
import { db } from "@/lib/db";
import { calcularPrecoTotal } from "@/lib/catalogo/calcularPreco";

async function exigirAcessoCRM() {
  const session = await getServerSession(authOptions);
  if (!temAcessoCRM(session?.user?.papel)) {
    throw new Error("Sem permissão para criar orçamentos.");
  }
  return session!;
}

export async function buscarProdutosParaOrcamento(termo: string) {
  await exigirAcessoCRM();

  const termoLimpo = termo.trim();
  if (!termoLimpo) return [];

  const agora = new Date();

  const produtos = await db.produto.findMany({
    where: {
      OR: [
        { nome: { contains: termoLimpo, mode: "insensitive" } },
        { sku: { contains: termoLimpo, mode: "insensitive" } },
      ],
    },
    include: {
      promocoes: { where: { ativo: true, dataInicio: { lte: agora }, dataFim: { gte: agora } }, take: 1 },
      faixasPreco: { orderBy: { quantidadeMinima: "asc" } },
    },
    orderBy: { nome: "asc" },
    take: 20,
  });

  return produtos.map((produto) => ({
    id: produto.id,
    sku: produto.sku,
    nome: produto.nome,
    unidade: produto.unidade ?? "un",
    precoUnitarioSugerido:
      produto.promocoes.length > 0
        ? Number(produto.promocoes[0].precoPromocional)
        : calcularPrecoTotal(produto, 1),
    temFaixaPreco: produto.faixasPreco.length > 0,
  }));
}

export type ItemOrcamentoInput = {
  produtoId: string;
  quantidade: number;
  valorUnitario: number;
  valorUnitarioDesconto: number;
};

export async function criarOrcamento(dados: {
  clienteNome: string;
  clienteTelefone?: string;
  clienteDocumento?: string;
  taxaEntrega: number;
  taxaFinanceira: number;
  formaPagamento?: string;
  parcelamento?: string;
  observacoes?: string;
  itens: ItemOrcamentoInput[];
}) {
  const session = await exigirAcessoCRM();

  if (dados.itens.length === 0) {
    throw new Error("Adicione ao menos um item ao orçamento.");
  }

  const orcamento = await db.orcamento.create({
    data: {
      clienteNome: dados.clienteNome || "Consumidor",
      clienteTelefone: dados.clienteTelefone || null,
      clienteDocumento: dados.clienteDocumento || null,
      vendedorId: session.user.id,
      taxaEntrega: dados.taxaEntrega,
      taxaFinanceira: dados.taxaFinanceira,
      formaPagamento: dados.formaPagamento || null,
      parcelamento: dados.parcelamento || null,
      observacoes: dados.observacoes || null,
      itens: {
        create: dados.itens.map((item) => ({
          produtoId: item.produtoId,
          quantidade: item.quantidade,
          valorUnitario: item.valorUnitario,
          valorUnitarioDesconto: item.valorUnitarioDesconto,
        })),
      },
    },
  });

  return { id: orcamento.id, numero: orcamento.numero };
}
