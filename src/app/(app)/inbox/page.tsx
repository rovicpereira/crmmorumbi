export default function InboxPage() {
  return (
    <div className="p-8">
      <h1 className="text-lg font-semibold text-slate-900">Inbox</h1>
      <p className="mt-2 text-sm text-slate-500">
        As conversas do WhatsApp vão aparecer aqui assim que o webhook for conectado (Fase 1). Cada
        conversa nova poderá ser classificada como &quot;Orçamento de obra&quot;, &quot;Pesquisa rápida&quot;
        ou &quot;Fora do mix&quot; — só a primeira entra no funil de vendas.
      </p>
    </div>
  );
}
