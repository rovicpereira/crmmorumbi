import { db } from "@/lib/db";

export default async function FunilPage() {
  const estagios = await db.estagioFunil.findMany({ orderBy: { ordem: "asc" } });

  return (
    <div className="p-8">
      <h1 className="text-lg font-semibold text-slate-900">Funil de vendas</h1>
      <p className="mt-2 text-sm text-slate-500">
        O quadro (kanban) com as conversas será construído na Fase 4. Estágios já cadastrados:
      </p>

      <div className="mt-4 flex gap-3">
        {estagios.map((estagio) => (
          <div
            key={estagio.id}
            className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
            style={{ borderTopColor: estagio.cor, borderTopWidth: 3 }}
          >
            {estagio.rotulo}
          </div>
        ))}
      </div>
    </div>
  );
}
