"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { temAcessoCRM } from "@/lib/permissoes";
import { importarCatalogoDeArquivo, type ResultadoImportacao } from "@/lib/catalogo/importar";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

async function exigirAcessoCRM() {
  const session = await getServerSession(authOptions);
  if (!temAcessoCRM(session?.user?.papel)) {
    throw new Error("Sem permissão para gerenciar o catálogo.");
  }
}

export async function importarCatalogo(formData: FormData): Promise<ResultadoImportacao> {
  await exigirAcessoCRM();

  const arquivo = formData.get("arquivo");

  if (!(arquivo instanceof File) || arquivo.size === 0) {
    return {
      criados: 0,
      atualizados: 0,
      ignorados: 0,
      erros: ["Nenhum arquivo selecionado."],
      colunasEncontradas: [],
    };
  }

  const buffer = Buffer.from(await arquivo.arrayBuffer());
  const resultado = await importarCatalogoDeArquivo(buffer);

  revalidatePath("/catalogo");
  return resultado;
}

export async function buscarProdutos(termo: string, categoriaId?: string) {
  await exigirAcessoCRM();

  const termoLimpo = termo.trim();

  return db.produto.findMany({
    where: {
      categoriaId: categoriaId || undefined,
      ...(termoLimpo
        ? {
            OR: [
              { nome: { contains: termoLimpo, mode: "insensitive" } },
              { sku: { contains: termoLimpo, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: { categoria: true },
    orderBy: { nome: "asc" },
    take: 100,
  });
}
