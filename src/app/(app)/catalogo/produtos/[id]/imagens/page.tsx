import { redirect, notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { temAcessoCRM } from "@/lib/permissoes";
import { db } from "@/lib/db";
import { ImagensProdutoClient } from "@/components/catalogo/imagens-produto-client";

export default async function ImagensProdutoPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (!temAcessoCRM(session?.user?.papel)) {
    redirect("/chat");
  }

  const produto = await db.produto.findUnique({
    where: { id: params.id },
    include: {
      categoria: true,
      imagens: { orderBy: { ordem: "asc" }, select: { id: true, nomeArquivo: true, ordem: true } },
    },
  });

  if (!produto) {
    notFound();
  }

  return <ImagensProdutoClient produto={produto} />;
}
