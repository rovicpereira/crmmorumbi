import * as XLSX from "xlsx";
import { db } from "@/lib/db";

type ColunaChave = "sku" | "precoPromocional" | "dataInicio" | "dataFim";

const ALIASES: Record<ColunaChave, string[]> = {
  sku: ["sku", "codigo", "cod", "codigo produto", "cod produto"],
  precoPromocional: [
    "preco promocional",
    "preco promo",
    "valor promocional",
    "preco oferta",
    "preco de promocao",
    "preco promocao",
  ],
  dataInicio: ["data inicio", "inicio", "data de inicio", "vigencia inicio", "inicio da promocao"],
  dataFim: ["data fim", "fim", "data de fim", "vigencia fim", "validade", "fim da promocao"],
};

function normalizar(texto: unknown): string {
  return String(texto ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase();
}

function mapearColunas(cabecalho: string[]): Partial<Record<ColunaChave, number>> {
  const normalizados = cabecalho.map(normalizar);
  const mapa: Partial<Record<ColunaChave, number>> = {};

  for (const chave of Object.keys(ALIASES) as ColunaChave[]) {
    const indice = normalizados.findIndex((coluna) => ALIASES[chave].includes(coluna));
    if (indice !== -1) {
      mapa[chave] = indice;
    }
  }

  return mapa;
}

function parseDataBase(valor: unknown): Date | null {
  if (valor instanceof Date && !Number.isNaN(valor.getTime())) {
    return valor;
  }

  const texto = String(valor ?? "").trim();
  const match = texto.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);

  if (match) {
    const [, dia, mes, anoTexto] = match;
    const ano = anoTexto.length === 2 ? 2000 + parseInt(anoTexto, 10) : parseInt(anoTexto, 10);
    return new Date(Date.UTC(ano, parseInt(mes, 10) - 1, parseInt(dia, 10)));
  }

  const tentativa = new Date(texto);
  return Number.isNaN(tentativa.getTime()) ? null : tentativa;
}

function parseDataInicio(valor: unknown): Date | null {
  const data = parseDataBase(valor);
  if (!data) return null;
  return new Date(Date.UTC(data.getUTCFullYear(), data.getUTCMonth(), data.getUTCDate(), 0, 0, 0));
}

function parseDataFim(valor: unknown): Date | null {
  const data = parseDataBase(valor);
  if (!data) return null;
  return new Date(Date.UTC(data.getUTCFullYear(), data.getUTCMonth(), data.getUTCDate(), 23, 59, 59, 999));
}

export type ResultadoImportacaoPromocoes = {
  criados: number;
  atualizados: number;
  ignorados: number;
  erros: string[];
  colunasEncontradas: string[];
};

export async function importarPromocoesDeArquivo(buffer: Buffer): Promise<ResultadoImportacaoPromocoes> {
  const planilha = XLSX.read(buffer, { type: "buffer", cellDates: true });
  const primeiraAba = planilha.Sheets[planilha.SheetNames[0]];
  const linhas: unknown[][] = XLSX.utils.sheet_to_json(primeiraAba, {
    header: 1,
    blankrows: false,
  });

  if (linhas.length < 2) {
    return {
      criados: 0,
      atualizados: 0,
      ignorados: 0,
      erros: ["Planilha vazia ou sem dados."],
      colunasEncontradas: [],
    };
  }

  const cabecalho = linhas[0].map((valor) => String(valor ?? ""));
  const colunas = mapearColunas(cabecalho);

  if (
    colunas.sku === undefined ||
    colunas.precoPromocional === undefined ||
    colunas.dataInicio === undefined ||
    colunas.dataFim === undefined
  ) {
    return {
      criados: 0,
      atualizados: 0,
      ignorados: 0,
      erros: [
        "Não encontrei as colunas obrigatórias (SKU, Preço promocional, Data início, Data fim) na planilha.",
      ],
      colunasEncontradas: cabecalho,
    };
  }

  const produtos = await db.produto.findMany({ select: { id: true, sku: true } });
  const produtoIdPorSku = new Map(produtos.map((p) => [p.sku, p.id]));

  let criados = 0;
  let atualizados = 0;
  let ignorados = 0;
  const erros: string[] = [];

  for (let i = 1; i < linhas.length; i++) {
    const linha = linhas[i];
    const sku = String(linha[colunas.sku] ?? "").trim();

    if (!sku) {
      ignorados++;
      continue;
    }

    const produtoId = produtoIdPorSku.get(sku);
    if (!produtoId) {
      ignorados++;
      erros.push(`Linha ${i + 1}: SKU ${sku} não encontrado no catálogo — cadastre o produto antes de importar a promoção.`);
      continue;
    }

    const precoBruto = linha[colunas.precoPromocional];
    const preco = typeof precoBruto === "number" ? precoBruto : parseFloat(String(precoBruto ?? "").replace(",", "."));
    const dataInicio = parseDataInicio(linha[colunas.dataInicio]);
    const dataFim = parseDataFim(linha[colunas.dataFim]);

    if (Number.isNaN(preco) || !dataInicio || !dataFim) {
      ignorados++;
      erros.push(`Linha ${i + 1}: preço ou datas inválidas para o SKU ${sku}.`);
      continue;
    }

    if (dataFim < dataInicio) {
      ignorados++;
      erros.push(`Linha ${i + 1}: data fim anterior à data início para o SKU ${sku}.`);
      continue;
    }

    const existente = await db.promocao.findUnique({
      where: { produtoId_dataInicio_dataFim: { produtoId, dataInicio, dataFim } },
    });

    await db.promocao.upsert({
      where: { produtoId_dataInicio_dataFim: { produtoId, dataInicio, dataFim } },
      update: { precoPromocional: preco, ativo: true },
      create: { produtoId, precoPromocional: preco, dataInicio, dataFim },
    });

    if (existente) {
      atualizados++;
    } else {
      criados++;
    }
  }

  return { criados, atualizados, ignorados, erros: erros.slice(0, 20), colunasEncontradas: cabecalho };
}
