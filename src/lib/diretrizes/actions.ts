"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { temAcessoDiretrizes } from "@/lib/permissoes";
import { importarDiretrizesDeArquivo, type ResultadoImportacaoDiretrizes } from "@/lib/diretrizes/importar";
import { revalidatePath } from "next/cache";

async function exigirAcessoDiretrizes() {
  const session = await getServerSession(authOptions);
  if (!temAcessoDiretrizes(session?.user?.papel)) {
    throw new Error("Sem permissão para gerenciar diretrizes comerciais.");
  }
}

export async function importarDiretrizes(formData: FormData): Promise<ResultadoImportacaoDiretrizes> {
  await exigirAcessoDiretrizes();

  const arquivo = formData.get("arquivo");

  if (!(arquivo instanceof File) || arquivo.size === 0) {
    return {
      baseCriadasOuAtualizadas: 0,
      campanhasCriadasOuAtualizadas: 0,
      ignorados: 0,
      erros: ["Nenhum arquivo selecionado."],
      colunasEncontradas: [],
    };
  }

  const buffer = Buffer.from(await arquivo.arrayBuffer());
  const resultado = await importarDiretrizesDeArquivo(buffer);

  revalidatePath("/diretrizes");
  return resultado;
}
