import { db } from "@/lib/db";
import { CatalogoClient } from "@/components/catalogo/catalogo-client";

export default async function CatalogoPage() {
  const [produtos, totalProdutos, categorias] = await Promise.all([
    db.produto.findMany({
      include: { categoria: true },
      orderBy: { nome: "asc" },
      take: 100,
    }),
    db.produto.count(),
    db.categoriaProduto.findMany({ orderBy: { ordem: "asc" } }),
  ]);

  return (
    <CatalogoClient
      produtosIniciais={produtos}
      totalProdutos={totalProdutos}
      categorias={categorias}
    />
  );
}
