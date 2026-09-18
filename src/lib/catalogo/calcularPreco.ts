type Faixa = {
  quantidadeMinima: unknown;
  quantidadeMaxima: unknown | null;
  precoPorUnidade: unknown;
};

/**
 * Calcula o valor total para uma quantidade de um produto.
 * Se o produto tiver faixas de preço cadastradas (ex: areia, brita — preço
 * muda conforme a quantidade), usa a faixa correspondente. Caso contrário,
 * usa o preço de tabela simples (precoVenda x quantidade).
 */
export function calcularPrecoTotal(
  produto: { precoVenda: unknown; faixasPreco: Faixa[] },
  quantidade: number
): number {
  if (produto.faixasPreco.length > 0) {
    const faixa = produto.faixasPreco.find((f) => {
      const minimo = Number(f.quantidadeMinima);
      const maximo = f.quantidadeMaxima === null ? Infinity : Number(f.quantidadeMaxima);
      return quantidade >= minimo && quantidade <= maximo;
    });

    if (faixa) {
      return Number(faixa.precoPorUnidade) * quantidade;
    }
  }

  return Number(produto.precoVenda) * quantidade;
}
