"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { salvarRegraEntrega } from "@/lib/entrega/actions";

type RegraEntrega = {
  valorMinimoEntregaGratuita: unknown;
  pesoMinimoEntregaKg: unknown;
  raioEntregaGratuitaKm: unknown;
  valorPorKmRodado: unknown;
} | null;

function paraTexto(valor: unknown): string {
  return valor === null || valor === undefined ? "" : String(valor);
}

export function RegraEntregaForm({ regraEntrega }: { regraEntrega: RegraEntrega }) {
  const router = useRouter();
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);

  async function handleSalvar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setSalvando(true);
    setSalvo(false);

    const formData = new FormData(evento.currentTarget);
    await salvarRegraEntrega(formData);

    setSalvando(false);
    setSalvo(true);
    router.refresh();
  }

  return (
    <div className="mt-8">
      <h2 className="text-sm font-semibold text-slate-900">Regras de entrega</h2>
      <p className="mt-1 max-w-2xl text-sm text-slate-500">
        Regra geral da loja (não muda por categoria) — orienta quando a entrega é gratuita, a
        partir de que peso ela é feita, e quanto cobrar quando não for gratuita.
      </p>

      <form
        onSubmit={handleSalvar}
        className="mt-3 grid max-w-xl grid-cols-1 gap-4 rounded-md border border-slate-200 bg-white p-4 sm:grid-cols-2"
      >
        <label className="text-sm">
          <span className="mb-1 block font-medium text-slate-700">
            Valor mínimo para entrega gratuita (R$)
          </span>
          <input
            type="number"
            step="0.01"
            min="0"
            name="valorMinimoEntregaGratuita"
            defaultValue={paraTexto(regraEntrega?.valorMinimoEntregaGratuita)}
            placeholder="Ex: 300"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </label>

        <label className="text-sm">
          <span className="mb-1 block font-medium text-slate-700">Peso mínimo para entrega (kg)</span>
          <input
            type="number"
            step="0.01"
            min="0"
            name="pesoMinimoEntregaKg"
            defaultValue={paraTexto(regraEntrega?.pesoMinimoEntregaKg)}
            placeholder="Ex: 20"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </label>

        <label className="text-sm">
          <span className="mb-1 block font-medium text-slate-700">Raio de entrega gratuita (km)</span>
          <input
            type="number"
            step="0.1"
            min="0"
            name="raioEntregaGratuitaKm"
            defaultValue={paraTexto(regraEntrega?.raioEntregaGratuitaKm)}
            placeholder="Ex: 5"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </label>

        <label className="text-sm">
          <span className="mb-1 block font-medium text-slate-700">Valor cobrado por km rodado (R$)</span>
          <input
            type="number"
            step="0.01"
            min="0"
            name="valorPorKmRodado"
            defaultValue={paraTexto(regraEntrega?.valorPorKmRodado)}
            placeholder="Ex: 2,50"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </label>

        <div className="flex items-center gap-3 sm:col-span-2">
          <button
            type="submit"
            disabled={salvando}
            className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {salvando ? "Salvando..." : "Salvar regras de entrega"}
          </button>
          {salvo && <span className="text-sm text-emerald-600">Salvo!</span>}
        </div>
      </form>
    </div>
  );
}
