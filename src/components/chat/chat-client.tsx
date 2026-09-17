"use client";

import { useEffect, useRef, useState } from "react";
import { buscarMensagensChat, enviarMensagemChat } from "@/lib/chat/actions";
import { ROTULOS_PAPEL } from "@/lib/permissoes";

type Colega = { id: string; nome: string; papel: string };
type Mensagem = {
  id: string;
  remetenteId: string;
  destinatarioId: string;
  texto: string;
  criadoEm: Date;
};

const INTERVALO_ATUALIZACAO_MS = 4000;

export function ChatClient({
  meuId,
  colegas,
  naoLidas,
}: {
  meuId: string;
  colegas: Colega[];
  naoLidas: Record<string, number>;
}) {
  const [colegaSelecionado, setColegaSelecionado] = useState<Colega | null>(
    colegas[0] ?? null
  );
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [texto, setTexto] = useState("");
  const [naoLidasLocal, setNaoLidasLocal] = useState(naoLidas);
  const fimDaListaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!colegaSelecionado) return;

    let cancelado = false;

    async function atualizar() {
      const dados = await buscarMensagensChat(colegaSelecionado!.id);
      if (!cancelado) {
        setMensagens(dados);
        setNaoLidasLocal((atual) => ({ ...atual, [colegaSelecionado!.id]: 0 }));
      }
    }

    atualizar();
    const intervalo = setInterval(atualizar, INTERVALO_ATUALIZACAO_MS);

    return () => {
      cancelado = true;
      clearInterval(intervalo);
    };
  }, [colegaSelecionado]);

  useEffect(() => {
    fimDaListaRef.current?.scrollIntoView({ block: "end" });
  }, [mensagens]);

  async function handleEnviar(evento: React.FormEvent) {
    evento.preventDefault();
    if (!colegaSelecionado || !texto.trim()) return;

    const textoEnviado = texto;
    setTexto("");
    await enviarMensagemChat(colegaSelecionado.id, textoEnviado);
    const dados = await buscarMensagensChat(colegaSelecionado.id);
    setMensagens(dados);
  }

  return (
    <div className="flex h-screen">
      <div className="w-64 border-r border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-4 py-4">
          <h1 className="text-sm font-semibold text-slate-900">Chat da equipe</h1>
        </div>
        <nav className="overflow-y-auto">
          {colegas.map((colega) => {
            const naoLidasColega = naoLidasLocal[colega.id] ?? 0;
            return (
              <button
                key={colega.id}
                onClick={() => setColegaSelecionado(colega)}
                className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm ${
                  colegaSelecionado?.id === colega.id
                    ? "bg-brand-50"
                    : "hover:bg-slate-50"
                }`}
              >
                <span>
                  <span className="block font-medium text-slate-800">{colega.nome}</span>
                  <span className="block text-xs text-slate-500">
                    {ROTULOS_PAPEL[colega.papel] ?? colega.papel}
                  </span>
                </span>
                {naoLidasColega > 0 && (
                  <span className="rounded-full bg-brand-600 px-2 py-0.5 text-xs font-medium text-white">
                    {naoLidasColega}
                  </span>
                )}
              </button>
            );
          })}
          {colegas.length === 0 && (
            <p className="px-4 py-3 text-sm text-slate-500">
              Nenhum outro usuário cadastrado ainda.
            </p>
          )}
        </nav>
      </div>

      <div className="flex flex-1 flex-col">
        {colegaSelecionado ? (
          <>
            <div className="border-b border-slate-200 bg-white px-6 py-4">
              <p className="text-sm font-semibold text-slate-900">{colegaSelecionado.nome}</p>
              <p className="text-xs text-slate-500">
                {ROTULOS_PAPEL[colegaSelecionado.papel] ?? colegaSelecionado.papel}
              </p>
            </div>

            <div className="flex-1 space-y-2 overflow-y-auto px-6 py-4">
              {mensagens.map((mensagem) => {
                const enviadaPorMim = mensagem.remetenteId === meuId;
                return (
                  <div
                    key={mensagem.id}
                    className={`flex ${enviadaPorMim ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-sm rounded-lg px-3 py-2 text-sm ${
                        enviadaPorMim
                          ? "bg-brand-600 text-white"
                          : "bg-white text-slate-800 border border-slate-200"
                      }`}
                    >
                      {mensagem.texto}
                    </div>
                  </div>
                );
              })}
              <div ref={fimDaListaRef} />
            </div>

            <form onSubmit={handleEnviar} className="flex gap-2 border-t border-slate-200 bg-white px-4 py-3">
              <input
                value={texto}
                onChange={(evento) => setTexto(evento.target.value)}
                placeholder="Escreva uma mensagem..."
                className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
              <button
                type="submit"
                className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
              >
                Enviar
              </button>
            </form>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center text-sm text-slate-500">
            Selecione alguém para conversar.
          </div>
        )}
      </div>
    </div>
  );
}
