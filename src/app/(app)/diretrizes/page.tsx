import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { temAcessoDiretrizes } from "@/lib/permissoes";
import { db } from "@/lib/db";
import { DiretrizesClient } from "@/components/diretrizes/diretrizes-client";

export default async function DiretrizesPage() {
  const session = await getServerSession(authOptions);

  if (!temAcessoDiretrizes(session?.user?.papel)) {
    redirect("/inbox");
  }

  const agora = new Date();

  const [categorias, regraEntrega] = await Promise.all([
    db.categoriaProduto.findMany({
      orderBy: { ordem: "asc" },
      include: {
        diretriz: true,
        diretrizesTemporarias: {
          where: { ativo: true, dataInicio: { lte: agora }, dataFim: { gte: agora } },
          take: 1,
        },
      },
    }),
    db.regraEntrega.findUnique({ where: { id: "global" } }),
  ]);

  return <DiretrizesClient categorias={categorias} regraEntrega={regraEntrega} />;
}
