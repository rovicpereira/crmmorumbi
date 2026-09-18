"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { enviarImagensProduto, removerImagemProduto } from "@/lib/catalogo/imagens";

type Imagem = { id: string; nomeArquivo: string | null; ordem: number };
type Produto = {
  id: string;
  sku: string;
  nome: string;
  categoria: { nome: string } | null;
  imagens: Imagem[];
};

export function ImagensProdutoClient({ produto }: { produto: Produto }) {
  const router = useRouter();
  const [enviando, setEnviando] = useState(false);
  const [erros, setErros] = useState<string[]>([]);
  const [removendo, setRemovendo] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  async function handleEnviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setEnviando(true);
    setErros([]);

    const formData = new FormData(evento.currentTarget);
    const resultado = await enviarImagensProduto(produto.id, formData);

    setErros(resultado.erros);
    setEnviando(false);
    formRef.current?.reset();
    router.refresh();
  }

  async function handleRemover(imagemId: string) {
    setRemovendo(imagemId);
    await removerImagemProduto(imagemId, produto.id);
    setRemovendo(null);
    router.refresh();
  }

  return (
    <div className="p-8">
      <Link href="/catalogo" className="text-sm text-brand-600 hover:underline">
        ← Voltar ao catálogo
      </Link>

      <h1 className="mt-2 text-lg font-semibold text-slate-900">Fotos — {produto.nome}</h1>
      <p className="text-sm text-slate-500">
        {produto.sku} {produto.categoria ? `· ${produto.categoria.nome}` : ""}
      </p>

      <form
        ref={formRef}
        onSubmit={handleEnviar}
        className="mt-4 flex flex-wrap items-center gap-3 rounded-md border border-slate-200 bg-white p-4"
      >
        <input
          type="file"
          name="arquivos"
          accept="image/jpeg,image/png,image/webp"
          multiple
          required
          className="text-sm text-slate-700"
        />
        <button
          type="submit"
          disabled={enviando}
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {enviando ? "Enviando..." : "Enviar fotos"}
        </button>
        <span className="text-xs text-slate-400">JPG, PNG ou WEBP, até 5MB cada.</span>
      </form>

      {erros.length > 0 && (
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-700">
          {erros.map((erro, indice) => (
            <li key={indice}>{erro}</li>
          ))}
        </ul>
      )}

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {produto.imagens.map((imagem) => (
          <div key={imagem.id} className="overflow-hidden rounded-md border border-slate-200 bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/produtos/imagens/${imagem.id}`}
              alt={imagem.nomeArquivo ?? produto.nome}
              className="h-40 w-full object-cover"
            />
            <div className="flex items-center justify-between px-2 py-1.5">
              <span className="truncate text-xs text-slate-500">{imagem.nomeArquivo}</span>
              <button
                onClick={() => handleRemover(imagem.id)}
                disabled={removendo === imagem.id}
                className="text-xs font-medium text-red-600 hover:underline disabled:opacity-50"
              >
                Remover
              </button>
            </div>
          </div>
        ))}
        {produto.imagens.length === 0 && (
          <p className="col-span-full text-sm text-slate-500">Nenhuma foto cadastrada ainda.</p>
        )}
      </div>
    </div>
  );
}
