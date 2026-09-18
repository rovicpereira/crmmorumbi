import { db } from "@/lib/db";
import { CatalogoClient } from "@/components/catalogo/catalogo-client";

export default async function CatalogoPage() {
  const agora = new Date();

  const [produtos, totalProdutos, categorias] = await Promise.all([
    db.produto.findMany({
      include: {
        categoria: true,
        promocoes: {
          where: { ativo: true, dataInicio: { lte: agora }, dataFim: { gte: agora } },
          take: 1,
        },
        faixasPreco: { orderBy: { quantidadeMinima: "asc" } },
      },
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
