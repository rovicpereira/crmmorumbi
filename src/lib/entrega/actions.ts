"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { temAcessoDiretrizes } from "@/lib/permissoes";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

async function exigirAcessoDiretrizes() {
  const session = await getServerSession(authOptions);
  if (!temAcessoDiretrizes(session?.user?.papel)) {
    throw new Error("Sem permissão para gerenciar regras de entrega.");
  }
}

function paraNumeroOuNulo(valor: FormDataEntryValue | null): number | null {
  if (valor === null || valor === "") return null;
  const numero = parseFloat(String(valor).replace(",", "."));
  return Number.isNaN(numero) ? null : numero;
}

export async function salvarRegraEntrega(formData: FormData) {
  await exigirAcessoDiretrizes();

  const dados = {
    valorMinimoEntregaGratuita: paraNumeroOuNulo(formData.get("valorMinimoEntregaGratuita")),
    pesoMinimoEntregaKg: paraNumeroOuNulo(formData.get("pesoMinimoEntregaKg")),
    raioEntregaGratuitaKm: paraNumeroOuNulo(formData.get("raioEntregaGratuitaKm")),
    valorPorKmRodado: paraNumeroOuNulo(formData.get("valorPorKmRodado")),
  };

  await db.regraEntrega.upsert({
    where: { id: "global" },
    update: dados,
    create: { id: "global", ...dados },
  });

  revalidatePath("/diretrizes");
}
