-- CreateEnum
CREATE TYPE "TipoAtendimento" AS ENUM ('orcamento_obra', 'pesquisa_rapida', 'fora_do_mix');

-- DropForeignKey
ALTER TABLE "Conversa" DROP CONSTRAINT "Conversa_estagioFunilId_fkey";

-- AlterTable
ALTER TABLE "Conversa" ADD COLUMN     "resolvido" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "tipoAtendimento" "TipoAtendimento" NOT NULL DEFAULT 'orcamento_obra',
ALTER COLUMN "estagioFunilId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "Conversa_tipoAtendimento_idx" ON "Conversa"("tipoAtendimento");

-- AddForeignKey
ALTER TABLE "Conversa" ADD CONSTRAINT "Conversa_estagioFunilId_fkey" FOREIGN KEY ("estagioFunilId") REFERENCES "EstagioFunil"("id") ON DELETE SET NULL ON UPDATE CASCADE;
