export const PAPEIS_COM_ACESSO_CRM = [
  "admin",
  "gerente_geral",
  "gerente_comercial",
  "vendedor",
] as const;

export function temAcessoCRM(papel: string | undefined | null): boolean {
  return !!papel && (PAPEIS_COM_ACESSO_CRM as readonly string[]).includes(papel);
}

export const ROTULOS_PAPEL: Record<string, string> = {
  admin: "Administrador",
  gerente_geral: "Gerente geral",
  gerente_comercial: "Gerente comercial",
  vendedor: "Vendedor",
  caixa: "Caixa",
  responsavel_expedicao: "Responsável de expedição",
};
