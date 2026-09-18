"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { buscarProdutosParaOrcamento, criarOrcamento } from "@/lib/orcamento/actions";
import { converterOrcamentoEmPedido } from "@/lib/pedido/actions";

type ResultadoBusca = {
  id: string;
  sku: string;
  nome: string;
  unidade: string;
  precoUnitarioSugerido: number;
  temFaixaPreco: boolean;
};

type ItemLinha = {
  produtoId: string;
  sku: string;
  nome: string;
  unidade: string;
  quantidade: number;
  valorUnitario: number;
  valorUnitarioDesconto: number;
};

function formatarMoeda(valor: number): string {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function OrcamentoBuilder() {
  const router = useRouter();
  const [convertendo, setConvertendo] = useState(false);
  const [termo, setTermo] = useState("");
  const [resultados, setResultados] = useState<ResultadoBusca[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [itens, setItens] = useState<ItemLinha[]>([]);

  const [clienteNome, setClienteNome] = useState("");
  const [clienteTelefone, setClienteTelefone] = useState("");
  const [clienteDocumento, setClienteDocumento] = useState("");
  const [taxaEntrega, setTaxaEntrega] = useState(0);
  const [taxaFinanceira, setTaxaFinanceira] = useState(0);
  const [formaPagamento, setFormaPagamento] = useState("Dinheiro");
  const [parcelamento, setParcelamento] = useState("À vista");
  const [observacoes, setObservacoes] = useState("");

  const [criando, setCriando] = useState(false);
  const [orcamentoCriado, setOrcamentoCriado] = useState<{ id: string; numero: number } | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  async function handleBuscar(novoTermo: string) {
    setTermo(novoTermo);
    if (novoTermo.trim().length < 2) {
      setResultados([]);
      return;
    }
    setBuscando(true);
    try {
      const dados = await buscarProdutosParaOrcamento(novoTermo);
      setResultados(dados);
    } finally {
      setBuscando(false);
    }
  }

  function adicionarItem(produto: ResultadoBusca) {
    if (itens.some((item) => item.produtoId === produto.id)) return;
    setItens((atual) => [
      ...atual,
      {
        produtoId: produto.id,
        sku: produto.sku,
        nome: produto.nome,
        unidade: produto.unidade,
        quantidade: 1,
        valorUnitario: produto.precoUnitarioSugerido,
        valorUnitarioDesconto: produto.precoUnitarioSugerido,
      },
    ]);
    setTermo("");
    setResultados([]);
  }

  function atualizarItem(produtoId: string, campo: keyof ItemLinha, valor: number) {
    setItens((atual) =>
      atual.map((item) => (item.produtoId === produtoId ? { ...item, [campo]: valor } : item))
    );
  }

  function removerItem(produtoId: string) {
    setItens((atual) => atual.filter((item) => item.produtoId !== produtoId));
  }

  const valorTotalProdutos = itens.reduce((soma, item) => soma + item.valorUnitario * item.quantidade, 0);
  const descontoTotal = itens.reduce(
    (soma, item) => soma + (item.valorUnitario - item.valorUnitarioDesconto) * item.quantidade,
    0
  );
  const totalOrcamento = valorTotalProdutos - descontoTotal + taxaEntrega + taxaFinanceira;

  async function handleCriarOrcamento() {
    setErro(null);
    setCriando(true);
    try {
      const resultado = await criarOrcamento({
        clienteNome,
        clienteTelefone,
        clienteDocumento,
        taxaEntrega,
        taxaFinanceira,
        formaPagamento,
        parcelamento,
        observacoes,
        itens: itens.map((item) => ({
          produtoId: item.produtoId,
          quantidade: item.quantidade,
          valorUnitario: item.valorUnitario,
          valorUnitarioDesconto: item.valorUnitarioDesconto,
        })),
      });
      setOrcamentoCriado(resultado);
    } catch (erroCapturado) {
      setErro(erroCapturado instanceof Error ? erroCapturado.message : "Erro ao criar orçamento.");
    } finally {
      setCriando(false);
    }
  }

  async function handleConverterEmPedido() {
    if (!orcamentoCriado) return;
    setConvertendo(true);
    try {
      const pedido = await converterOrcamentoEmPedido(orcamentoCriado.id);
      router.push(`/pedidos/${pedido.id}`);
    } finally {
      setConvertendo(false);
    }
  }

  if (orcamentoCriado) {
    return (
      <div className="p-8">
        <h1 className="text-lg font-semibold text-slate-900">
          Orçamento nº {orcamentoCriado.numero} criado!
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Envie esta imagem para o cliente. Ela mostra só o valor total — sem preço unitário nem
          desconto por item.
        </p>

        <div className="mt-4 max-w-2xl overflow-hidden rounded-md border border-slate-200 shadow-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/orcamentos/${orcamentoCriado.id}/imagem?formato=simples`}
            alt={`Orçamento nº ${orcamentoCriado.numero}`}
            className="w-full"
          />
        </div>

        <div className="mt-4 flex items-center gap-3">
          <a
            href={`/api/orcamentos/${orcamentoCriado.id}/imagem?formato=simples`}
            download={`orcamento-${orcamentoCriado.numero}.png`}
            className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            Baixar imagem
          </a>
          <details className="text-sm">
            <summary className="cursor-pointer font-medium text-slate-600 hover:text-slate-800">
              Cliente pediu o preço de cada item? Veja a versão detalhada
            </summary>
            <a
              href={`/api/orcamentos/${orcamentoCriado.id}/imagem?formato=detalhado`}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-block rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Ver imagem detalhada (com preço por item)
            </a>
          </details>
        </div>

        <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-sm text-emerald-800">
            Cliente aprovou este orçamento? Converta em pedido para acompanhar expedição,
            faturamento, caixa e entrega.
          </p>
          <button
            onClick={handleConverterEmPedido}
            disabled={convertendo}
            className="mt-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {convertendo ? "Convertendo..." : "Converter em pedido"}
          </button>
        </div>

        <button
          onClick={() => {
            setOrcamentoCriado(null);
            setItens([]);
            setClienteNome("");
            setClienteTelefone("");
            setClienteDocumento("");
            setObservacoes("");
          }}
          className="mt-6 text-sm font-medium text-brand-600 hover:underline"
        >
          Criar outro orçamento
        </button>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-lg font-semibold text-slate-900">Novo orçamento</h1>
      <p className="mt-1 text-sm text-slate-500">
        Monte a lista de materiais, ajuste os valores se precisar negociar, e gere a imagem para
        enviar ao cliente.
      </p>

      <div className="mt-4 rounded-md border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-900">Cliente</h2>
        <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <input
            value={clienteNome}
            onChange={(e) => setClienteNome(e.target.value)}
            placeholder="Nome do cliente"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            value={clienteTelefone}
            onChange={(e) => setClienteTelefone(e.target.value)}
            placeholder="Telefone"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            value={clienteDocumento}
            onChange={(e) => setClienteDocumento(e.target.value)}
            placeholder="CPF/CNPJ (opcional)"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="relative mt-4 rounded-md border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-900">Itens</h2>
        <input
          value={termo}
          onChange={(e) => handleBuscar(e.target.value)}
          placeholder="Buscar produto por nome ou SKU..."
          className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        {termo.trim().length >= 2 && (
          <div className="absolute z-10 mt-1 max-h-64 w-[calc(100%-2rem)] overflow-y-auto rounded-md border border-slate-200 bg-white shadow-lg">
            {buscando && <div className="px-3 py-2 text-sm text-slate-500">Buscando...</div>}
            {!buscando && resultados.length === 0 && (
              <div className="px-3 py-2 text-sm text-slate-500">Nenhum produto encontrado.</div>
            )}
            {resultados.map((produto) => (
              <button
                key={produto.id}
                onClick={() => adicionarItem(produto)}
                className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-slate-50"
              >
                <span>
                  <span className="font-medium text-slate-800">{produto.nome}</span>
                  <span className="ml-2 text-xs text-slate-400">{produto.sku}</span>
                </span>
                <span className="text-xs text-slate-500">
                  {produto.temFaixaPreco ? "por quantidade" : formatarMoeda(produto.precoUnitarioSugerido)}
                </span>
              </button>
            ))}
          </div>
        )}

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-slate-500">
              <tr>
                <th className="py-1 pr-2">Produto</th>
                <th className="py-1 pr-2">Qtde</th>
                <th className="py-1 pr-2">Vlr. Unit.</th>
                <th className="py-1 pr-2">Vlr. c/ Desconto</th>
                <th className="py-1 pr-2">Total</th>
                <th className="py-1"></th>
              </tr>
            </thead>
            <tbody>
              {itens.map((item) => (
                <tr key={item.produtoId} className="border-t border-slate-100">
                  <td className="py-2 pr-2">
                    {item.nome} <span className="text-xs text-slate-400">({item.sku})</span>
                  </td>
                  <td className="py-2 pr-2">
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={item.quantidade}
                      onChange={(e) => atualizarItem(item.produtoId, "quantidade", parseFloat(e.target.value) || 0)}
                      className="w-20 rounded-md border border-slate-300 px-2 py-1"
                    />
                  </td>
                  <td className="py-2 pr-2">{formatarMoeda(item.valorUnitario)}</td>
                  <td className="py-2 pr-2">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.valorUnitarioDesconto}
                      onChange={(e) =>
                        atualizarItem(item.produtoId, "valorUnitarioDesconto", parseFloat(e.target.value) || 0)
                      }
                      className="w-24 rounded-md border border-slate-300 px-2 py-1"
                    />
                  </td>
                  <td className="py-2 pr-2">{formatarMoeda(item.valorUnitarioDesconto * item.quantidade)}</td>
                  <td className="py-2">
                    <button
                      onClick={() => removerItem(item.produtoId)}
                      className="text-xs text-red-600 hover:underline"
                    >
                      Remover
                    </button>
                  </td>
                </tr>
              ))}
              {itens.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-4 text-center text-slate-500">
                    Nenhum item adicionado ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 rounded-md border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-900">Entrega, pagamento e observações</h2>
        <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="text-sm">
            <span className="mb-1 block text-slate-600">Taxa de entrega (R$)</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={taxaEntrega}
              onChange={(e) => setTaxaEntrega(parseFloat(e.target.value) || 0)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-slate-600">Taxa financeira (R$)</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={taxaFinanceira}
              onChange={(e) => setTaxaFinanceira(parseFloat(e.target.value) || 0)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-slate-600">Forma de pagamento</span>
            <input
              value={formaPagamento}
              onChange={(e) => setFormaPagamento(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-slate-600">Parcelamento</span>
            <input
              value={parcelamento}
              onChange={(e) => setParcelamento(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm sm:col-span-2">
            <span className="mb-1 block text-slate-600">Observações</span>
            <input
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between rounded-md border border-slate-200 bg-white p-4">
        <div className="text-sm">
          <div>Valor total produtos: {formatarMoeda(valorTotalProdutos)}</div>
          <div>Desconto: {formatarMoeda(descontoTotal)}</div>
          <div className="text-base font-semibold text-slate-900">
            Total do orçamento: {formatarMoeda(totalOrcamento)}
          </div>
        </div>
        <button
          onClick={handleCriarOrcamento}
          disabled={criando || itens.length === 0}
          className="rounded-md bg-brand-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {criando ? "Gerando..." : "Gerar orçamento"}
        </button>
      </div>

      {erro && <p className="mt-2 text-sm text-red-600">{erro}</p>}
    </div>
  );
}
