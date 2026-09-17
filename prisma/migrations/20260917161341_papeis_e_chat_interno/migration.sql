-- Recreate enum "Papel" without "atendente", adding the new roles
CREATE TYPE "Papel_new" AS ENUM ('admin', 'gerente_geral', 'gerente_comercial', 'vendedor', 'caixa', 'responsavel_expedicao');

ALTER TABLE "Usuario" ALTER COLUMN "papel" DROP DEFAULT;
ALTER TABLE "Usuario" ALTER COLUMN "papel" TYPE "Papel_new" USING (
  CASE "papel"::text
    WHEN 'atendente' THEN 'vendedor'
    ELSE "papel"::text
  END
)::"Papel_new";

ALTER TYPE "Papel" RENAME TO "Papel_old";
ALTER TYPE "Papel_new" RENAME TO "Papel";
DROP TYPE "Papel_old";

ALTER TABLE "Usuario" ALTER COLUMN "papel" SET DEFAULT 'vendedor';

-- CreateTable
CREATE TABLE "MensagemChat" (
    "id" TEXT NOT NULL,
    "remetenteId" TEXT NOT NULL,
    "destinatarioId" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "lida" BOOLEAN NOT NULL DEFAULT false,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MensagemChat_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MensagemChat_remetenteId_idx" ON "MensagemChat"("remetenteId");

-- CreateIndex
CREATE INDEX "MensagemChat_destinatarioId_idx" ON "MensagemChat"("destinatarioId");

-- AddForeignKey
ALTER TABLE "MensagemChat" ADD CONSTRAINT "MensagemChat_remetenteId_fkey" FOREIGN KEY ("remetenteId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MensagemChat" ADD CONSTRAINT "MensagemChat_destinatarioId_fkey" FOREIGN KEY ("destinatarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
