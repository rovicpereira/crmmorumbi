import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { temAcessoCRM } from "@/lib/permissoes";
import { OrcamentoBuilder } from "@/components/orcamento/orcamento-builder";

export default async function NovoOrcamentoPage() {
  const session = await getServerSession(authOptions);

  if (!temAcessoCRM(session?.user?.papel)) {
    redirect("/chat");
  }

  return <OrcamentoBuilder />;
}
