"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { temAcessoCRM } from "@/lib/permissoes";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

const TIPOS_ACEITOS = ["image/jpeg", "image/png", "image/webp"];
const TAMANHO_MAXIMO_BYTES = 5 * 1024 * 1024; // 5MB por imagem

async function exigirAcessoCRM() {
  const session = await getServerSession(authOptions);
  if (!temAcessoCRM(session?.user?.papel)) {
    throw new Error("Sem permissão para gerenciar imagens do catálogo.");
  }
}

export async function buscarProdutoComImagens(produtoId: string) {
  await exigirAcessoCRM();

  return db.produto.findUnique({
    where: { id: produtoId },
    include: {
      categoria: true,
      imagens: { orderBy: { ordem: "asc" }, select: { id: true, nomeArquivo: true, ordem: true } },
    },
  });
}

export async function enviarImagensProduto(produtoId: string, formData: FormData) {
  await exigirAcessoCRM();

  const arquivos = formData.getAll("arquivos").filter((valor): valor is File => valor instanceof File);
  const erros: string[] = [];
  let enviadas = 0;

  const totalAtual = await db.imagemProduto.count({ where: { produtoId } });

  for (const [indice, arquivo] of arquivos.entries()) {
    if (arquivo.size === 0) continue;

    if (!TIPOS_ACEITOS.includes(arquivo.type)) {
      erros.push(`${arquivo.name}: formato não aceito (use JPG, PNG ou WEBP).`);
      continue;
    }

    if (arquivo.size > TAMANHO_MAXIMO_BYTES) {
      erros.push(`${arquivo.name}: maior que 5MB.`);
      continue;
    }

    const buffer = Buffer.from(await arquivo.arrayBuffer());

    await db.imagemProduto.create({
      data: {
        produtoId,
        dados: buffer,
        mimeType: arquivo.type,
        nomeArquivo: arquivo.name,
        ordem: totalAtual + indice,
      },
    });

    enviadas++;
  }

  revalidatePath(`/catalogo/produtos/${produtoId}/imagens`);
  return { enviadas, erros };
}

export async function removerImagemProduto(imagemId: string, produtoId: string) {
  await exigirAcessoCRM();

  await db.imagemProduto.delete({ where: { id: imagemId } });

  revalidatePath(`/catalogo/produtos/${produtoId}/imagens`);
}
