import * as XLSX from "xlsx";
import { db } from "@/lib/db";
import { mapearColunas } from "@/lib/planilha/utils";

type ColunaChave = "sku" | "quantidadeMinima" | "quantidadeMaxima" | "precoPorUnidade";

const ALIASES: Record<ColunaChave, string[]> = {
  sku: ["sku", "codigo", "cod", "codigo produto", "cod produto"],
  quantidadeMinima: ["quantidade minima", "qtd minima", "de", "minimo", "quantidade de"],
  quantidadeMaxima: ["quantidade maxima", "qtd maxima", "ate", "maximo", "quantidade ate"],
  precoPorUnidade: ["preco por unidade", "preco unidade", "valor unidade", "preco", "valor"],
};

function paraNumero(valor: unknown): number | null {
  if (valor === undefined || valor === null || valor === "") return null;
  const numero = typeof valor === "number" ? valor : parseFloat(String(valor).replace(",", "."));
  return Number.isNaN(numero) ? null : numero;
}

export type ResultadoImportacaoFaixas = {
  criadas: number;
  atualizadas: number;
  ignoradas: number;
  erros: string[];
  colunasEncontradas: string[];
};

export async function importarFaixasPrecoDeArquivo(buffer: Buffer): Promise<ResultadoImportacaoFaixas> {
  const planilha = XLSX.read(buffer, { type: "buffer" });
  const primeiraAba = planilha.Sheets[planilha.SheetNames[0]];
  const linhas: unknown[][] = XLSX.utils.sheet_to_json(primeiraAba, {
    header: 1,
    blankrows: false,
  });

  if (linhas.length < 2) {
    return {
      criadas: 0,
      atualizadas: 0,
      ignoradas: 0,
      erros: ["Planilha vazia ou sem dados."],
      colunasEncontradas: [],
    };
  }

  const cabecalho = linhas[0].map((valor) => String(valor ?? ""));
  const colunas = mapearColunas(cabecalho, ALIASES);

  if (colunas.sku === undefined || colunas.quantidadeMinima === undefined || colunas.precoPorUnidade === undefined) {
    return {
      criadas: 0,
      atualizadas: 0,
      ignoradas: 0,
      erros: [
        "Não encontrei as colunas obrigatórias (SKU, Quantidade Mínima, Preço por Unidade) na planilha.",
      ],
      colunasEncontradas: cabecalho,
    };
  }

  const produtos = await db.produto.findMany({ select: { id: true, sku: true } });
  const produtoIdPorSku = new Map(produtos.map((p) => [p.sku, p.id]));

  let criadas = 0;
  let atualizadas = 0;
  let ignoradas = 0;
  const erros: string[] = [];

  for (let i = 1; i < linhas.length; i++) {
    const linha = linhas[i];
    const sku = String(linha[colunas.sku] ?? "").trim();

    if (!sku) {
      ignoradas++;
      continue;
    }

    const produtoId = produtoIdPorSku.get(sku);
    if (!produtoId) {
      ignoradas++;
      erros.push(`Linha ${i + 1}: SKU ${sku} não encontrado no catálogo.`);
      continue;
    }

    const quantidadeMinima = paraNumero(linha[colunas.quantidadeMinima]);
    const quantidadeMaxima =
      colunas.quantidadeMaxima !== undefined ? paraNumero(linha[colunas.quantidadeMaxima]) : null;
    const precoPorUnidade = paraNumero(linha[colunas.precoPorUnidade]);

    if (quantidadeMinima === null || precoPorUnidade === null) {
      ignoradas++;
      erros.push(`Linha ${i + 1}: quantidade mínima ou preço inválidos para o SKU ${sku}.`);
      continue;
    }

    if (quantidadeMaxima !== null && quantidadeMaxima < quantidadeMinima) {
      ignoradas++;
      erros.push(`Linha ${i + 1}: quantidade máxima menor que a mínima para o SKU ${sku}.`);
      continue;
    }

    const existente = await db.faixaPrecoProduto.findUnique({
      where: { produtoId_quantidadeMinima: { produtoId, quantidadeMinima } },
    });

    await db.faixaPrecoProduto.upsert({
      where: { produtoId_quantidadeMinima: { produtoId, quantidadeMinima } },
      update: { quantidadeMaxima, precoPorUnidade },
      create: { produtoId, quantidadeMinima, quantidadeMaxima, precoPorUnidade },
    });

    if (existente) {
      atualizadas++;
    } else {
      criadas++;
    }
  }

  return { criadas, atualizadas, ignoradas, erros: erros.slice(0, 20), colunasEncontradas: cabecalho };
}
