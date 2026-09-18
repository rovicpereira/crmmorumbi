import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { temAcessoCRM } from "@/lib/permissoes";
import { db } from "@/lib/db";
import { statusAtualPedido } from "@/lib/pedido/status";

export default async function PedidosPage() {
  const session = await getServerSession(authOptions);

  if (!temAcessoCRM(session?.user?.papel)) {
    redirect("/chat");
  }

  const pedidos = await db.pedido.findMany({
    include: { orcamento: true },
    orderBy: { criadoEm: "desc" },
  });

  return (
    <div className="p-8">
      <h1 className="text-lg font-semibold text-slate-900">Pedidos</h1>
      <p className="mt-1 text-sm text-slate-500">
        Acompanhamento do checklist de cada venda confirmada: expedição → cliente confirma data →
        faturamento → caixa → entrega agendada. Um pedido nasce quando um orçamento é convertido.
      </p>

      <div className="mt-4 overflow-x-auto rounded-md border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2">Pedido</th>
              <th className="px-4 py-2">Cliente</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Criado em</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {pedidos.map((pedido) => (
              <tr key={pedido.id} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-2 text-slate-800">nº {pedido.numero}</td>
                <td className="px-4 py-2 text-slate-600">{pedido.orcamento.clienteNome ?? "—"}</td>
                <td className="px-4 py-2">
                  <span
                    className={`rounded px-1.5 py-0.5 text-xs font-medium ${
                      pedido.cancelado
                        ? "bg-red-50 text-red-700"
                        : statusAtualPedido(pedido) === "Concluído"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {statusAtualPedido(pedido)}
                  </span>
                </td>
                <td className="px-4 py-2 text-slate-500">
                  {pedido.criadoEm.toLocaleDateString("pt-BR")}
                </td>
                <td className="px-4 py-2">
                  <Link href={`/pedidos/${pedido.id}`} className="text-brand-600 hover:underline">
                    Ver detalhes
                  </Link>
                </td>
              </tr>
            ))}
            {pedidos.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                  Nenhum pedido ainda. Gere um orçamento e converta em pedido quando o cliente aprovar.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
