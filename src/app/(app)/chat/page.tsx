import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { ChatClient } from "@/components/chat/chat-client";

export default async function ChatPage() {
  const session = await getServerSession(authOptions);
  const meuId = session!.user.id;

  const colegas = await db.usuario.findMany({
    where: { ativo: true, id: { not: meuId } },
    select: { id: true, nome: true, papel: true },
    orderBy: { nome: "asc" },
  });

  const naoLidasPorRemetente = await db.mensagemChat.groupBy({
    by: ["remetenteId"],
    where: { destinatarioId: meuId, lida: false },
    _count: { _all: true },
  });

  const naoLidas = Object.fromEntries(
    naoLidasPorRemetente.map((item) => [item.remetenteId, item._count._all])
  );

  return <ChatClient meuId={meuId} colegas={colegas} naoLidas={naoLidas} />;
}
