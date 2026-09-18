"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { importarDiretrizes } from "@/lib/diretrizes/actions";
import type { ResultadoImportacaoDiretrizes } from "@/lib/diretrizes/importar";
import { RegraEntregaForm } from "@/components/diretrizes/regra-entrega-form";

type Regra = {
  descontoMaximoPercentual: unknown;
  valorMaximoAutonomo: unknown;
  formasPagamentoAceitas: string | null;
  regrasLivres: string | null;
};

type Categoria = {
  id: string;
  nome: string;
  diretriz: Regra | null;
  diretrizesTemporarias: Regra[];
};

function formatarPercentual(valor: unknown): string {
  if (valor === null || valor === undefined) return "—";
  return `${Number(valor).toLocaleString("pt-BR")}%`;
}

function formatarValor(valor: unknown): string {
  if (valor === null || valor === undefined) return "—";
  return Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

type RegraEntrega = {
  valorMinimoEntregaGratuita: unknown;
  pesoMinimoEntregaKg: unknown;
  raioEntregaGratuitaKm: unknown;
  valorPorKmRodado: unknown;
} | null;

export function DiretrizesClient({
  categorias,
  regraEntrega,
}: {
  categorias: Categoria[];
  regraEntrega: RegraEntrega;
}) {
  const router = useRouter();
  const [importando, setImportando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoImportacaoDiretrizes | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  async function handleImportar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setImportando(true);
    setResultado(null);

    const formData = new FormData(evento.currentTarget);
    const resultadoImportacao = await importarDiretrizes(formData);

    setResultado(resultadoImportacao);
    setImportando(false);
    formRef.current?.reset();
    router.refresh();
  }

  return (
    <div className="p-8">
      <h1 className="text-lg font-semibold text-slate-900">Diretrizes comerciais</h1>
      <p className="mt-1 max-w-2xl text-sm text-slate-500">
        Regras de negociação por categoria — vão orientar o que o atendimento (e futuramente a IA)
        pode decidir sozinho. Suba uma planilha com Categoria, Desconto Máximo (%), Valor Máximo
        Autônomo, Formas de Pagamento e Regras. Linhas <strong>sem</strong> Data Início/Data Fim
        atualizam a regra permanente da categoria. Linhas <strong>com</strong> as duas datas criam
        uma campanha temporária, que vale só naquele período e depois volta sozinha para a regra
        permanente, sem precisar apagar nada.
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
          {importando ? "Importando..." : "Importar diretrizes"}
        </button>
      </form>

      {resultado && (
        <div className="mt-3 rounded-md border border-slate-200 bg-white p-4 text-sm">
          <p className="font-medium text-slate-800">
            Importação concluída: {resultado.baseCriadasOuAtualizadas} regra(s) permanente(s)
            atualizada(s), {resultado.campanhasCriadasOuAtualizadas} campanha(s) temporária(s)
            criada(s)/atualizada(s), {resultado.ignorados} linha(s) ignorada(s).
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

      <div className="mt-6 overflow-x-auto rounded-md border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2">Categoria</th>
              <th className="px-4 py-2">Desconto máximo</th>
              <th className="px-4 py-2">Valor máximo autônomo</th>
              <th className="px-4 py-2">Formas de pagamento</th>
              <th className="px-4 py-2">Regras</th>
            </tr>
          </thead>
          <tbody>
            {categorias.map((categoria) => {
              const campanhaAtiva = categoria.diretrizesTemporarias[0];
              const regra = campanhaAtiva ?? categoria.diretriz;

              return (
                <tr key={categoria.id} className="border-b border-slate-100 last:border-0 align-top">
                  <td className="px-4 py-2 font-medium text-slate-800">
                    {categoria.nome}
                    {campanhaAtiva && (
                      <span className="ml-2 rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">
                        CAMPANHA ATIVA
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-slate-700">
                    {formatarPercentual(regra?.descontoMaximoPercentual)}
                  </td>
                  <td className="px-4 py-2 text-slate-700">
                    {formatarValor(regra?.valorMaximoAutonomo)}
                  </td>
                  <td className="px-4 py-2 text-slate-700">{regra?.formasPagamentoAceitas ?? "—"}</td>
                  <td className="px-4 py-2 text-slate-600">{regra?.regrasLivres ?? "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <RegraEntregaForm regraEntrega={regraEntrega} />
    </div>
  );
}
