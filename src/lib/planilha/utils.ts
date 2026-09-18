export function normalizar(texto: unknown): string {
  return String(texto ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase();
}

export function mapearColunas<T extends string>(
  cabecalho: string[],
  aliases: Record<T, string[]>
): Partial<Record<T, number>> {
  const normalizados = cabecalho.map(normalizar);
  const mapa: Partial<Record<T, number>> = {};

  for (const chave of Object.keys(aliases) as T[]) {
    const indice = normalizados.findIndex((coluna) => aliases[chave].includes(coluna));
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

export function parseDataInicio(valor: unknown): Date | null {
  const data = parseDataBase(valor);
  if (!data) return null;
  return new Date(Date.UTC(data.getUTCFullYear(), data.getUTCMonth(), data.getUTCDate(), 0, 0, 0));
}

export function parseDataFim(valor: unknown): Date | null {
  const data = parseDataBase(valor);
  if (!data) return null;
  return new Date(
    Date.UTC(data.getUTCFullYear(), data.getUTCMonth(), data.getUTCDate(), 23, 59, 59, 999)
  );
}
