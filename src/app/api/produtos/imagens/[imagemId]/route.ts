import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  { params }: { params: { imagemId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new Response("Não autenticado", { status: 401 });
  }

  const imagem = await db.imagemProduto.findUnique({
    where: { id: params.imagemId },
    select: { dados: true, mimeType: true },
  });

  if (!imagem) {
    return new Response("Imagem não encontrada", { status: 404 });
  }

  return new Response(new Uint8Array(imagem.dados), {
    headers: {
      "content-type": imagem.mimeType,
      "cache-control": "private, max-age=86400",
    },
  });
}
