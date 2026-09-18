-- CreateTable
CREATE TABLE "Promocao" (
    "id" TEXT NOT NULL,
    "produtoId" TEXT NOT NULL,
    "precoPromocional" DECIMAL(10,2) NOT NULL,
    "dataInicio" TIMESTAMP(3) NOT NULL,
    "dataFim" TIMESTAMP(3) NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Promocao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Promocao_produtoId_idx" ON "Promocao"("produtoId");

-- CreateIndex
CREATE INDEX "Promocao_dataInicio_dataFim_idx" ON "Promocao"("dataInicio", "dataFim");

-- CreateIndex
CREATE UNIQUE INDEX "Promocao_produtoId_dataInicio_dataFim_key" ON "Promocao"("produtoId", "dataInicio", "dataFim");

-- AddForeignKey
ALTER TABLE "Promocao" ADD CONSTRAINT "Promocao_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "Produto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
