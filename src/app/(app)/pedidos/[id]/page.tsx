import { redirect, notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { temAcessoCRM } from "@/lib/permissoes";
import { db } from "@/lib/db";
import { PedidoChecklist } from "@/components/pedido/pedido-checklist";

export default async function PedidoDetalhePage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (!temAcessoCRM(session?.user?.papel)) {
    redirect("/chat");
  }

  const pedido = await db.pedido.findUnique({
    where: { id: params.id },
    include: {
      orcamento: {
        include: { itens: { include: { produto: true } } },
      },
    },
  });

  if (!pedido) {
    notFound();
  }

  return <PedidoChecklist pedido={pedido} />;
}
