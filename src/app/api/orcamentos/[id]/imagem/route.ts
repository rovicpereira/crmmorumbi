import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { readFileSync } from "fs";
import path from "path";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { calcularAlturaImagem, montarElementoOrcamento } from "@/lib/orcamento/imagem";

export const runtime = "nodejs";

// Carregamos a fonte manualmente (em vez de deixar o next/og usar a padrão
// dele) porque a versão embutida tem um bug de caminho no Windows durante o
// desenvolvimento local (ERR_INVALID_URL ao montar o file:// da fonte).
const fonteNotoSans = readFileSync(
  path.join(process.cwd(), "src/lib/orcamento/fonts/noto-sans-regular.ttf")
);

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new Response("Não autenticado", { status: 401 });
  }

  const formatoParam = request.nextUrl.searchParams.get("formato");
  const formato = formatoParam === "detalhado" ? "detalhado" : "simples";

  const orcamento = await db.orcamento.findUnique({
    where: { id: params.id },
    include: {
      vendedor: true,
      itens: { include: { produto: true } },
    },
  });

  if (!orcamento) {
    return new Response("Orçamento não encontrado", { status: 404 });
  }

  const itens = orcamento.itens.map((item) => ({
    sku: item.produto.sku,
    nome: item.produto.nome,
    unidade: item.produto.unidade ?? "un",
    quantidade: Number(item.quantidade),
    valorUnitario: Number(item.valorUnitario),
    valorUnitarioDesconto: Number(item.valorUnitarioDesconto),
  }));

  const elemento = montarElementoOrcamento(
    {
      numero: orcamento.numero,
      criadoEm: orcamento.criadoEm,
      clienteNome: orcamento.clienteNome ?? "Consumidor",
      clienteTelefone: orcamento.clienteTelefone,
      clienteDocumento: orcamento.clienteDocumento,
      vendedorNome: orcamento.vendedor?.nome,
      taxaEntrega: Number(orcamento.taxaEntrega),
      taxaFinanceira: Number(orcamento.taxaFinanceira),
      formaPagamento: orcamento.formaPagamento,
      parcelamento: orcamento.parcelamento,
      observacoes: orcamento.observacoes,
      itens,
    },
    formato
  );

  return new ImageResponse(elemento, {
    width: 800,
    height: calcularAlturaImagem(itens.length, formato),
    fonts: [
      {
        name: "sans-serif",
        data: fonteNotoSans,
        weight: 400,
        style: "normal",
      },
    ],
  });
}
