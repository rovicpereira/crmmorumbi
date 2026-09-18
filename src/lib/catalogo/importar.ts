import * as XLSX from "xlsx";
import { db } from "@/lib/db";
import { normalizar, mapearColunas } from "@/lib/planilha/utils";

type ColunaChave = "sku" | "nome" | "categoria" | "precoVenda" | "unidade" | "estoqueDisponivel";

const ALIASES: Record<ColunaChave, string[]> = {
  sku: ["sku", "codigo", "cod", "codigo produto", "cod produto", "codigo do produto"],
  nome: ["nome", "descricao", "produto", "nome produto", "nome do produto"],
  categoria: ["categoria", "grupo", "familia", "departamento"],
  precoVenda: ["preco", "preco venda", "valor", "valor venda", "preco de venda", "preco unitario"],
  unidade: ["unidade", "un", "medida", "unid"],
  estoqueDisponivel: ["estoque", "quantidade", "qtd", "saldo", "estoque disponivel"],
};

export type ResultadoImportacao = {
  criados: number;
  atualizados: number;
  ignorados: number;
  erros: string[];
  colunasEncontradas: string[];
};

export async function importarCatalogoDeArquivo(buffer: Buffer): Promise<ResultadoImportacao> {
  const planilha = XLSX.read(buffer, { type: "buffer" });
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
  const colunas = mapearColunas(cabecalho, ALIASES);

  if (colunas.sku === undefined || colunas.nome === undefined || colunas.precoVenda === undefined) {
    return {
      criados: 0,
      atualizados: 0,
      ignorados: 0,
      erros: [
        "Não encontrei as colunas obrigatórias (SKU/Código, Nome/Descrição, Preço) na planilha. Verifique os títulos das colunas na primeira linha.",
      ],
      colunasEncontradas: cabecalho,
    };
  }

  const categorias = await db.categoriaProduto.findMany();
  const categoriaPorNome = new Map(categorias.map((c) => [normalizar(c.nome), c.id]));

  const skusExistentes = new Set(
    (await db.produto.findMany({ select: { sku: true } })).map((p) => p.sku)
  );

  let criados = 0;
  let atualizados = 0;
  let ignorados = 0;
  const erros: string[] = [];
  const categoriasNaoReconhecidas = new Set<string>();

  for (let i = 1; i < linhas.length; i++) {
    const linha = linhas[i];
    const sku = normalizar(linha[colunas.sku]) ? String(linha[colunas.sku]).trim() : "";
    const nome = linha[colunas.nome] ? String(linha[colunas.nome]).trim() : "";
    const precoBruto = linha[colunas.precoVenda];

    if (!sku || !nome || precoBruto === undefined || precoBruto === null || precoBruto === "") {
      ignorados++;
      continue;
    }

    const preco =
      typeof precoBruto === "number" ? precoBruto : parseFloat(String(precoBruto).replace(",", "."));

    if (Number.isNaN(preco)) {
      ignorados++;
      erros.push(`Linha ${i + 1}: preço inválido para o SKU ${sku}.`);
      continue;
    }

    const categoriaTexto =
      colunas.categoria !== undefined ? String(linha[colunas.categoria] ?? "").trim() : "";
    const categoriaId = categoriaTexto ? categoriaPorNome.get(normalizar(categoriaTexto)) : undefined;

    if (categoriaTexto && !categoriaId) {
      categoriasNaoReconhecidas.add(categoriaTexto);
    }

    const unidade =
      colunas.unidade !== undefined ? String(linha[colunas.unidade] ?? "").trim() || undefined : undefined;

    const estoqueBruto = colunas.estoqueDisponivel !== undefined ? linha[colunas.estoqueDisponivel] : undefined;
    const estoqueParsed =
      estoqueBruto !== undefined && estoqueBruto !== null && estoqueBruto !== ""
        ? parseInt(String(estoqueBruto), 10)
        : NaN;
    const estoqueDisponivel = Number.isNaN(estoqueParsed) ? undefined : estoqueParsed;

    await db.produto.upsert({
      where: { sku },
      update: {
        nome,
        precoVenda: preco,
        categoriaId: categoriaId ?? null,
        unidade,
        estoqueDisponivel,
      },
      create: {
        sku,
        nome,
        precoVenda: preco,
        categoriaId: categoriaId ?? null,
        unidade,
        estoqueDisponivel,
      },
    });

    if (skusExistentes.has(sku)) {
      atualizados++;
    } else {
      criados++;
      skusExistentes.add(sku);
    }
  }

  if (categoriasNaoReconhecidas.size > 0) {
    erros.push(
      `Categorias não reconhecidas (produtos importados sem categoria): ${[...categoriasNaoReconhecidas].join(", ")}`
    );
  }

  return { criados, atualizados, ignorados, erros: erros.slice(0, 20), colunasEncontradas: cabecalho };
}
