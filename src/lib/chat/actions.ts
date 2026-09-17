"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

async function usuarioAtualId() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error("Não autenticado");
  }
  return session.user.id;
}

export async function buscarMensagensChat(comUsuarioId: string) {
  const meuId = await usuarioAtualId();

  const mensagens = await db.mensagemChat.findMany({
    where: {
      OR: [
        { remetenteId: meuId, destinatarioId: comUsuarioId },
        { remetenteId: comUsuarioId, destinatarioId: meuId },
      ],
    },
    orderBy: { criadoEm: "asc" },
  });

  await db.mensagemChat.updateMany({
    where: { remetenteId: comUsuarioId, destinatarioId: meuId, lida: false },
    data: { lida: true },
  });

  return mensagens;
}

export async function enviarMensagemChat(destinatarioId: string, texto: string) {
  const meuId = await usuarioAtualId();
  const textoLimpo = texto.trim();

  if (!textoLimpo) {
    return;
  }

  await db.mensagemChat.create({
    data: {
      remetenteId: meuId,
      destinatarioId,
      texto: textoLimpo,
    },
  });
}
