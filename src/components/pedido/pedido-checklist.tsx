"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  marcarEtapaPedido,
  desmarcarEtapaPedido,
  cancelarPedido,
  type EtapaPedido,
} from "@/lib/pedido/actions";
import { statusAtualPedido } from "@/lib/pedido/status";

type Item = { id: string; quantidade: unknown; produto: { sku: string; nome: string; unidade: string | null } };
type Pedido = {
  id: string;
  numero: number;
  expedicaoConfirmada: boolean;
  expedicaoConfirmadaEm: Date | null;
  clienteConfirmouData: boolean;
  clienteConfirmouDataEm: Date | null;
  dataEntregaCombinada: Date | null;
  faturado: boolean;
  faturadoEm: Date | null;
  baixadoCaixa: boolean;
  baixadoCaixaEm: Date | null;
  entregaAgendada: boolean;
  entregaAgendadaEm: Date | null;
  cancelado: boolean;
  orcamento: {
    id: string;
    clienteNome: string | null;
    clienteTelefone: string | null;
    itens: Item[];
  };
};

const ETAPAS: { chave: EtapaPedido; rotulo: string; descricao: string }[] = [
  {
    chave: "expedicaoConfirmada",
    rotulo: "Expedição confirmou disponibilidade",
    descricao: "Confirme com a expedição antes de prometer qualquer data ao cliente.",
  },
  {
    chave: "clienteConfirmouData",
    rotulo: "Cliente confirmou a data",
    descricao: "Só depois da expedição confirmar — informe a data combinada.",
  },
  { chave: "faturado", rotulo: "Faturado no ERP", descricao: "A equipe faturou a venda no sistema." },
  { chave: "baixadoCaixa", rotulo: "Baixado no caixa", descricao: "Pagamento conferido no caixa." },
  { chave: "entregaAgendada", rotulo: "Entrega agendada", descricao: "Data e caminhão/rota definidos." },
];

function formatarDataHora(data: Date | null): string {
  if (!data) return "";
  return new Date(data).toLocaleString("pt-BR");
}

// dataEntregaCombinada é uma data "de calendário" (sem hora) guardada como
// meia-noite UTC — exibir sempre em UTC evita que o fuso horário do
// navegador jogue pra um dia antes (ex: 18/10 virando 17/10).
function formatarDataCalendario(data: Date): string {
  return new Date(data).toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

export function PedidoChecklist({ pedido }: { pedido: Pedido }) {
  const router = useRouter();
  const [processando, setProcessando] = useState<EtapaPedido | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [dataEntrega, setDataEntrega] = useState("");

  async function handleMarcar(etapa: EtapaPedido) {
    setErro(null);
    setProcessando(etapa);
    try {
      await marcarEtapaPedido(pedido.id, etapa, etapa === "clienteConfirmouData" ? dataEntrega : undefined);
      router.refresh();
    } catch (erroCapturado) {
      setErro(erroCapturado instanceof Error ? erroCapturado.message : "Erro ao atualizar etapa.");
    } finally {
      setProcessando(null);
    }
  }

  async function handleDesmarcar(etapa: EtapaPedido) {
    setErro(null);
    setProcessando(etapa);
    try {
      await desmarcarEtapaPedido(pedido.id, etapa);
      router.refresh();
    } catch (erroCapturado) {
      setErro(erroCapturado instanceof Error ? erroCapturado.message : "Erro ao atualizar etapa.");
    } finally {
      setProcessando(null);
    }
  }

  async function handleCancelar() {
    if (!confirm("Cancelar este pedido?")) return;
    await cancelarPedido(pedido.id);
    router.refresh();
  }

  return (
    <div className="p-8">
      <Link href="/pedidos" className="text-sm text-brand-600 hover:underline">
        ← Voltar aos pedidos
      </Link>

      <div className="mt-2 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Pedido nº {pedido.numero}</h1>
          <p className="text-sm text-slate-500">
            {pedido.orcamento.clienteNome} {pedido.orcamento.clienteTelefone ? `· ${pedido.orcamento.clienteTelefone}` : ""}
          </p>
        </div>
        <span className="rounded bg-slate-100 px-2 py-1 text-sm font-medium text-slate-700">
          {statusAtualPedido(pedido)}
        </span>
      </div>

      <div className="mt-4 rounded-md border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-900">Itens</h2>
        <ul className="mt-2 space-y-1 text-sm text-slate-600">
          {pedido.orcamento.itens.map((item) => (
            <li key={item.id}>
              {String(item.quantidade)} {item.produto.unidade ?? "un"} — {item.produto.nome} (
              {item.produto.sku})
            </li>
          ))}
        </ul>
      </div>

      {erro && (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {erro}
        </div>
      )}

      <div className="mt-4 space-y-3">
        {ETAPAS.map((etapa, indice) => {
          const concluida = pedido[etapa.chave] as boolean;
          const dataConclusao = pedido[`${etapa.chave}Em` as keyof Pedido] as Date | null;
          const etapaAnterior = ETAPAS[indice - 1];
          const bloqueada = etapaAnterior ? !(pedido[etapaAnterior.chave] as boolean) : false;

          return (
            <div
              key={etapa.chave}
              className={`rounded-md border p-4 ${
                concluida
                  ? "border-emerald-200 bg-emerald-50"
                  : bloqueada
                    ? "border-slate-200 bg-slate-50 opacity-60"
                    : "border-slate-200 bg-white"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-800">
                    {indice + 1}. {etapa.rotulo}
                  </p>
                  <p className="text-xs text-slate-500">{etapa.descricao}</p>
                  {concluida && (
                    <p className="mt-1 text-xs text-emerald-700">
                      Concluído em {formatarDataHora(dataConclusao)}
                      {etapa.chave === "clienteConfirmouData" && pedido.dataEntregaCombinada && (
                        <> — entrega combinada para {formatarDataCalendario(pedido.dataEntregaCombinada)}</>
                      )}
                    </p>
                  )}
                </div>

                {!concluida && !bloqueada && (
                  <div className="flex items-center gap-2">
                    {etapa.chave === "clienteConfirmouData" && (
                      <input
                        type="date"
                        value={dataEntrega}
                        onChange={(e) => setDataEntrega(e.target.value)}
                        className="rounded-md border border-slate-300 px-2 py-1 text-sm"
                      />
                    )}
                    <button
                      onClick={() => handleMarcar(etapa.chave)}
                      disabled={processando === etapa.chave || pedido.cancelado}
                      className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
                    >
                      Marcar concluído
                    </button>
                  </div>
                )}

                {concluida && (
                  <button
                    onClick={() => handleDesmarcar(etapa.chave)}
                    disabled={processando === etapa.chave}
                    className="text-xs font-medium text-slate-500 hover:underline disabled:opacity-60"
                  >
                    Desfazer
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {!pedido.cancelado && (
        <button onClick={handleCancelar} className="mt-6 text-sm font-medium text-red-600 hover:underline">
          Cancelar pedido
        </button>
      )}
    </div>
  );
}
