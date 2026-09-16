"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";

const ITENS_NAV = [
  { href: "/inbox", rotulo: "Inbox" },
  { href: "/funil", rotulo: "Funil" },
  { href: "/clientes", rotulo: "Clientes" },
  { href: "/lembretes", rotulo: "Lembretes" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const ehAdmin = session?.user?.papel === "admin";

  return (
    <aside className="flex h-screen w-56 flex-col border-r border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-4 py-4">
        <p className="text-sm font-semibold text-slate-900">Morumbi CRM</p>
        <p className="text-xs text-slate-500">WhatsApp</p>
      </div>

      <nav className="flex-1 space-y-1 px-2 py-4">
        {ITENS_NAV.map((item) => {
          const ativo = pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-md px-3 py-2 text-sm font-medium ${
                ativo
                  ? "bg-brand-50 text-brand-700"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {item.rotulo}
            </Link>
          );
        })}

        {ehAdmin && (
          <Link
            href="/admin/usuarios"
            className={`block rounded-md px-3 py-2 text-sm font-medium ${
              pathname?.startsWith("/admin")
                ? "bg-brand-50 text-brand-700"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Usuários
          </Link>
        )}
      </nav>

      <div className="border-t border-slate-200 px-4 py-3">
        <p className="truncate text-xs text-slate-500">{session?.user?.name}</p>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="mt-1 text-xs font-medium text-slate-500 hover:text-slate-800"
        >
          Sair
        </button>
      </div>
    </aside>
  );
}
