import * as XLSX from "xlsx";
import { db } from "@/lib/db";
import { normalizar, mapearColunas, parseDataInicio, parseDataFim } from "@/lib/planilha/utils";

type ColunaChave =
  | "categoria"
  | "descontoMaximo"
  | "valorMaximo"
  | "formasPagamento"
  | "regras"
  | "dataInicio"
  | "dataFim";

const ALIASES: Record<ColunaChave, string[]> = {
  categoria: ["categoria", "grupo", "familia", "departamento"],
  descontoMaximo: [
    "desconto maximo",
    "desconto max",
    "desconto %",
    "desconto maximo %",
    "desconto maximo percentual",
    "desconto",
  ],
  valorMaximo: [
    "valor maximo",
    "valor maximo autonomo",
    "valor max",
    "limite valor",
    "valor limite",
    "valor maximo do pedido",
  ],
  formasPagamento: [
    "formas pagamento",
    "forma de pagamento",
    "pagamento",
    "formas de pagamento",
    "formas de pagamento aceitas",
  ],
  regras: ["regras", "regras livres", "observacoes", "obs", "instrucoes", "regra"],
  dataInicio: ["data inicio", "inicio", "data de inicio", "vigencia inicio"],
  dataFim: ["data fim", "fim", "data de fim", "vigencia fim", "validade"],
};

export type ResultadoImportacaoDiretrizes = {
  baseCriadasOuAtualizadas: number;
  campanhasCriadasOuAtualizadas: number;
  ignorados: number;
  erros: string[];
  colunasEncontradas: string[];
};

export async function importarDiretrizesDeArquivo(buffer: Buffer): Promise<ResultadoImportacaoDiretrizes> {
  const planilha = XLSX.read(buffer, { type: "buffer", cellDates: true });
  const primeiraAba = planilha.Sheets[planilha.SheetNames[0]];
  const linhas: unknown[][] = XLSX.utils.sheet_to_json(primeiraAba, {
    header: 1,
    blankrows: false,
  });

  if (linhas.length < 2) {
    return {
      baseCriadasOuAtualizadas: 0,
      campanhasCriadasOuAtualizadas: 0,
      ignorados: 0,
      erros: ["Planilha vazia ou sem dados."],
      colunasEncontradas: [],
    };
  }

  const cabecalho = linhas[0].map((valor) => String(valor ?? ""));
  const colunas = mapearColunas(cabecalho, ALIASES);

  if (colunas.categoria === undefined) {
    return {
      baseCriadasOuAtualizadas: 0,
      campanhasCriadasOuAtualizadas: 0,
      ignorados: 0,
      erros: ["Não encontrei a coluna obrigatória \"Categoria\" na planilha."],
      colunasEncontradas: cabecalho,
    };
  }

  const categorias = await db.categoriaProduto.findMany();
  const categoriaIdPorNome = new Map(categorias.map((c) => [normalizar(c.nome), c.id]));

  let baseCriadasOuAtualizadas = 0;
  let campanhasCriadasOuAtualizadas = 0;
  let ignorados = 0;
  const erros: string[] = [];

  for (let i = 1; i < linhas.length; i++) {
    const linha = linhas[i];
    const categoriaTexto = String(linha[colunas.categoria] ?? "").trim();

    if (!categoriaTexto) {
      ignorados++;
      continue;
    }

    const categoriaId = categoriaIdPorNome.get(normalizar(categoriaTexto));
    if (!categoriaId) {
      ignorados++;
      erros.push(`Linha ${i + 1}: categoria "${categoriaTexto}" não reconhecida.`);
      continue;
    }

    const descontoBruto = colunas.descontoMaximo !== undefined ? linha[colunas.descontoMaximo] : undefined;
    const desconto =
      descontoBruto !== undefined && descontoBruto !== null && descontoBruto !== ""
        ? typeof descontoBruto === "number"
          ? descontoBruto
          : parseFloat(String(descontoBruto).replace(",", ".").replace("%", ""))
        : undefined;

    const valorBruto = colunas.valorMaximo !== undefined ? linha[colunas.valorMaximo] : undefined;
    const valorMaximo =
      valorBruto !== undefined && valorBruto !== null && valorBruto !== ""
        ? typeof valorBruto === "number"
          ? valorBruto
          : parseFloat(String(valorBruto).replace(",", "."))
        : undefined;

    const formasPagamento =
      colunas.formasPagamento !== undefined
        ? String(linha[colunas.formasPagamento] ?? "").trim() || undefined
        : undefined;

    const regrasLivres =
      colunas.regras !== undefined ? String(linha[colunas.regras] ?? "").trim() || undefined : undefined;

    const dataInicioBruta = colunas.dataInicio !== undefined ? linha[colunas.dataInicio] : undefined;
    const dataFimBruta = colunas.dataFim !== undefined ? linha[colunas.dataFim] : undefined;
    const temDatas =
      dataInicioBruta !== undefined &&
      dataInicioBruta !== null &&
      dataInicioBruta !== "" &&
      dataFimBruta !== undefined &&
      dataFimBruta !== null &&
      dataFimBruta !== "";

    if (temDatas) {
      const dataInicio = parseDataInicio(dataInicioBruta);
      const dataFim = parseDataFim(dataFimBruta);

      if (!dataInicio || !dataFim) {
        ignorados++;
        erros.push(`Linha ${i + 1}: datas inválidas para a categoria "${categoriaTexto}".`);
        continue;
      }

      if (dataFim < dataInicio) {
        ignorados++;
        erros.push(`Linha ${i + 1}: data fim anterior à data início para a categoria "${categoriaTexto}".`);
        continue;
      }

      await db.diretrizComercialTemporaria.upsert({
        where: { categoriaId_dataInicio_dataFim: { categoriaId, dataInicio, dataFim } },
        update: {
          descontoMaximoPercentual: desconto,
          valorMaximoAutonomo: valorMaximo,
          formasPagamentoAceitas: formasPagamento,
          regrasLivres,
          ativo: true,
        },
        create: {
          categoriaId,
          descontoMaximoPercentual: desconto,
          valorMaximoAutonomo: valorMaximo,
          formasPagamentoAceitas: formasPagamento,
          regrasLivres,
          dataInicio,
          dataFim,
        },
      });

      campanhasCriadasOuAtualizadas++;
    } else {
      await db.diretrizComercial.upsert({
        where: { categoriaId },
        update: {
          descontoMaximoPercentual: desconto,
          valorMaximoAutonomo: valorMaximo,
          formasPagamentoAceitas: formasPagamento,
          regrasLivres,
        },
        create: {
          categoriaId,
          descontoMaximoPercentual: desconto,
          valorMaximoAutonomo: valorMaximo,
          formasPagamentoAceitas: formasPagamento,
          regrasLivres,
        },
      });

      baseCriadasOuAtualizadas++;
    }
  }

  return {
    baseCriadasOuAtualizadas,
    campanhasCriadasOuAtualizadas,
    ignorados,
    erros: erros.slice(0, 20),
    colunasEncontradas: cabecalho,
  };
}
