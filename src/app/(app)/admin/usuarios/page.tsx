import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function AdminUsuariosPage() {
  const session = await getServerSession(authOptions);

  if (session?.user?.papel !== "admin") {
    redirect("/inbox");
  }

  return (
    <div className="p-8">
      <h1 className="text-lg font-semibold text-slate-900">Usuários</h1>
      <p className="mt-2 text-sm text-slate-500">
        Cadastro de atendentes chega na Fase 3. Por enquanto, novos usuários podem ser criados
        diretamente pelo Prisma Studio (<code>npx prisma studio</code>).
      </p>
    </div>
  );
}
