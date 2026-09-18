"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { importarCatalogo, importarPromocoes, importarFaixasPreco, buscarProdutos } from "@/lib/catalogo/actions";
import type { ResultadoImportacao } from "@/lib/catalogo/importar";
import type { ResultadoImportacaoPromocoes } from "@/lib/catalogo/importarPromocoes";
import type { ResultadoImportacaoFaixas } from "@/lib/catalogo/importarFaixasPreco";

type Categoria = { id: string; nome: string; ordem: number };
type Promocao = { precoPromocional: unknown; dataFim: string | Date };
type FaixaPreco = { quantidadeMinima: unknown; quantidadeMaxima: unknown | null; precoPorUnidade: unknown };
type Produto = {
  id: string;
  sku: string;
  nome: string;
  precoVenda: unknown;
  unidade: string | null;
  estoqueDisponivel: number | null;
  ativo: boolean;
  categoria: Categoria | null;
  promocoes: Promocao[];
  faixasPreco: FaixaPreco[];
  _count: { imagens: number };
};

function formatarFaixa(faixa: FaixaPreco): string {
  const min = Number(faixa.quantidadeMinima);
  const max = faixa.quantidadeMaxima === null ? null : Number(faixa.quantidadeMaxima);
  const preco = formatarPreco(faixa.precoPorUnidade);
  return max === null ? `${min}+: ${preco}` : `${min}–${max}: ${preco}`;
}

function formatarPreco(preco: unknown): string {
  const numero = typeof preco === "number" ? preco : parseFloat(String(preco));
  return numero.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function CatalogoClient({
  produtosIniciais,
  totalProdutos,
  categorias,
}: {
  produtosIniciais: Produto[];
  totalProdutos: number;
  categorias: Categoria[];
}) {
  const [produtos, setProdutos] = useState(produtosIniciais);
  const [termo, setTermo] = useState("");
  const [categoriaId, setCategoriaId] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [importando, setImportando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoImportacao | null>(null);
  const [importandoPromocoes, setImportandoPromocoes] = useState(false);
  const [resultadoPromocoes, setResultadoPromocoes] = useState<ResultadoImportacaoPromocoes | null>(null);
  const [importandoFaixas, setImportandoFaixas] = useState(false);
  const [resultadoFaixas, setResultadoFaixas] = useState<ResultadoImportacaoFaixas | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const formPromocoesRef = useRef<HTMLFormElement>(null);
  const formFaixasRef = useRef<HTMLFormElement>(null);

  async function handleBuscar(novoTermo: string, novaCategoriaId: string) {
    setBuscando(true);
    try {
      const dados = await buscarProdutos(novoTermo, novaCategoriaId || undefined);
      setProdutos(dados as unknown as Produto[]);
    } finally {
      setBuscando(false);
    }
  }

  async function handleImportar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setImportando(true);
    setResultado(null);

    const formData = new FormData(evento.currentTarget);
    const resultadoImportacao = await importarCatalogo(formData);

    setResultado(resultadoImportacao);
    setImportando(false);
    formRef.current?.reset();
    handleBuscar(termo, categoriaId);
  }

  async function handleImportarPromocoes(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setImportandoPromocoes(true);
    setResultadoPromocoes(null);

    const formData = new FormData(evento.currentTarget);
    const resultadoImportacao = await importarPromocoes(formData);

    setResultadoPromocoes(resultadoImportacao);
    setImportandoPromocoes(false);
    formPromocoesRef.current?.reset();
    handleBuscar(termo, categoriaId);
  }

  async function handleImportarFaixas(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setImportandoFaixas(true);
    setResultadoFaixas(null);

    const formData = new FormData(evento.currentTarget);
    const resultadoImportacao = await importarFaixasPreco(formData);

    setResultadoFaixas(resultadoImportacao);
    setImportandoFaixas(false);
    formFaixasRef.current?.reset();
    handleBuscar(termo, categoriaId);
  }

  return (
    <div className="p-8">
      <h1 className="text-lg font-semibold text-slate-900">Catálogo de produtos</h1>
      <p className="mt-1 text-sm text-slate-500">
        {totalProdutos} produto(s) cadastrado(s). Importe uma planilha (Excel) sempre que os preços
        do ERP mudarem — a importação atualiza pelo SKU, sem duplicar.
      </p>

      <form
        ref={formRef}
        onSubmit={handleImportar}
        className="mt-4 flex flex-wrap items-center gap-3 rounded-md border border-slate-200 bg-white p-4"
      >
        <input
          type="file"
          name="arquivo"
          accept=".xlsx,.xls,.csv"
          required
          className="text-sm text-slate-700"
        />
        <button
          type="submit"
          disabled={importando}
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {importando ? "Importando..." : "Importar planilha"}
        </button>
      </form>

      {resultado && (
        <div className="mt-3 rounded-md border border-slate-200 bg-white p-4 text-sm">
          <p className="font-medium text-slate-800">
            Importação concluída: {resultado.criados} criado(s), {resultado.atualizados} atualizado(s),{" "}
            {resultado.ignorados} ignorado(s).
          </p>
          {resultado.erros.length > 0 && (
            <ul className="mt-2 list-disc space-y-1 pl-5 text-amber-700">
              {resultado.erros.map((erro, indice) => (
                <li key={indice}>{erro}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="mt-8">
        <h2 className="text-sm font-semibold text-slate-900">Promoções</h2>
        <p className="mt-1 text-sm text-slate-500">
          Suba uma planilha com SKU, preço promocional, data início e data fim. Enquanto a data
          estiver dentro do período, o preço promocional aparece automaticamente no lugar do preço
          de tabela — depois do período, volta sozinho ao preço normal, sem precisar apagar nada.
        </p>

        <form
          ref={formPromocoesRef}
          onSubmit={handleImportarPromocoes}
          className="mt-3 flex flex-wrap items-center gap-3 rounded-md border border-slate-200 bg-white p-4"
        >
          <input
            type="file"
            name="arquivo"
            accept=".xlsx,.xls,.csv"
            required
            className="text-sm text-slate-700"
          />
          <button
            type="submit"
            disabled={importandoPromocoes}
            className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {importandoPromocoes ? "Importando..." : "Importar promoções"}
          </button>
        </form>

        {resultadoPromocoes && (
          <div className="mt-3 rounded-md border border-slate-200 bg-white p-4 text-sm">
            <p className="font-medium text-slate-800">
              Importação concluída: {resultadoPromocoes.criados} criada(s),{" "}
              {resultadoPromocoes.atualizados} atualizada(s), {resultadoPromocoes.ignorados} ignorada(s).
            </p>
            {resultadoPromocoes.erros.length > 0 && (
              <ul className="mt-2 list-disc space-y-1 pl-5 text-amber-700">
                {resultadoPromocoes.erros.map((erro, indice) => (
                  <li key={indice}>{erro}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      <div className="mt-8">
        <h2 className="text-sm font-semibold text-slate-900">Preços por faixa de quantidade</h2>
        <p className="mt-1 max-w-2xl text-sm text-slate-500">
          Para produtos como areia e brita, cujo preço por unidade muda conforme a quantidade
          pedida. Suba uma planilha com SKU, Quantidade Mínima, Quantidade Máxima (deixe em branco
          se não houver limite superior) e Preço por Unidade. O valor final é calculado
          automaticamente pela faixa — o cliente só recebe o total, nunca a tabela de faixas.
        </p>

        <form
          ref={formFaixasRef}
          onSubmit={handleImportarFaixas}
          className="mt-3 flex flex-wrap items-center gap-3 rounded-md border border-slate-200 bg-white p-4"
        >
          <input
            type="file"
            name="arquivo"
            accept=".xlsx,.xls,.csv"
            required
            className="text-sm text-slate-700"
          />
          <button
            type="submit"
            disabled={importandoFaixas}
            className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {importandoFaixas ? "Importando..." : "Importar faixas de preço"}
          </button>
        </form>

        {resultadoFaixas && (
          <div className="mt-3 rounded-md border border-slate-200 bg-white p-4 text-sm">
            <p className="font-medium text-slate-800">
              Importação concluída: {resultadoFaixas.criadas} criada(s),{" "}
              {resultadoFaixas.atualizadas} atualizada(s), {resultadoFaixas.ignoradas} ignorada(s).
            </p>
            {resultadoFaixas.erros.length > 0 && (
              <ul className="mt-2 list-disc space-y-1 pl-5 text-amber-700">
                {resultadoFaixas.erros.map((erro, indice) => (
                  <li key={indice}>{erro}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <input
          value={termo}
          onChange={(evento) => {
            setTermo(evento.target.value);
            handleBuscar(evento.target.value, categoriaId);
          }}
          placeholder="Buscar por nome ou SKU..."
          className="w-64 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
        <select
          value={categoriaId}
          onChange={(evento) => {
            setCategoriaId(evento.target.value);
            handleBuscar(termo, evento.target.value);
          }}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        >
          <option value="">Todas as categorias</option>
          {categorias.map((categoria) => (
            <option key={categoria.id} value={categoria.id}>
              {categoria.nome}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-4 overflow-x-auto rounded-md border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2">SKU</th>
              <th className="px-4 py-2">Nome</th>
              <th className="px-4 py-2">Categoria</th>
              <th className="px-4 py-2">Preço</th>
              <th className="px-4 py-2">Unidade</th>
              <th className="px-4 py-2">Estoque</th>
              <th className="px-4 py-2">Fotos</th>
            </tr>
          </thead>
          <tbody>
            {produtos.map((produto) => (
              <tr key={produto.id} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-2 text-slate-600">{produto.sku}</td>
                <td className="px-4 py-2 text-slate-800">{produto.nome}</td>
                <td className="px-4 py-2 text-slate-600">{produto.categoria?.nome ?? "—"}</td>
                <td className="px-4 py-2">
                  {produto.promocoes.length > 0 ? (
                    <span>
                      <span className="mr-2 text-xs text-slate-400 line-through">
                        {formatarPreco(produto.precoVenda)}
                      </span>
                      <span className="font-semibold text-emerald-600">
                        {formatarPreco(produto.promocoes[0].precoPromocional)}
                      </span>
                      <span className="ml-1 rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">
                        PROMOÇÃO
                      </span>
                    </span>
                  ) : produto.faixasPreco.length > 0 ? (
                    <span>
                      <span className="rounded bg-sky-50 px-1.5 py-0.5 text-[10px] font-medium text-sky-700">
                        POR QUANTIDADE
                      </span>
                      <span className="mt-1 block text-xs text-slate-500">
                        {produto.faixasPreco.map(formatarFaixa).join(" · ")}
                      </span>
                    </span>
                  ) : (
                    <span className="text-slate-800">{formatarPreco(produto.precoVenda)}</span>
                  )}
                </td>
                <td className="px-4 py-2 text-slate-600">{produto.unidade ?? "—"}</td>
                <td className="px-4 py-2 text-slate-600">
                  {produto.estoqueDisponivel ?? "—"}
                </td>
                <td className="px-4 py-2">
                  <Link
                    href={`/catalogo/produtos/${produto.id}/imagens`}
                    className="text-xs font-medium text-brand-600 hover:underline"
                  >
                    {produto._count.imagens > 0 ? `${produto._count.imagens} foto(s)` : "Adicionar"}
                  </Link>
                </td>
              </tr>
            ))}
            {produtos.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-slate-500">
                  {buscando ? "Buscando..." : "Nenhum produto encontrado."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-2 text-xs text-slate-400">
        Mostrando até 100 resultados por vez — use a busca ou o filtro de categoria para refinar.
      </p>
    </div>
  );
}
