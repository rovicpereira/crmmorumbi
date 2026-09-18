-- CreateTable
CREATE TABLE "FaixaPrecoProduto" (
    "id" TEXT NOT NULL,
    "produtoId" TEXT NOT NULL,
    "quantidadeMinima" DECIMAL(10,2) NOT NULL,
    "quantidadeMaxima" DECIMAL(10,2),
    "precoPorUnidade" DECIMAL(10,2) NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FaixaPrecoProduto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FaixaPrecoProduto_produtoId_idx" ON "FaixaPrecoProduto"("produtoId");

-- CreateIndex
CREATE UNIQUE INDEX "FaixaPrecoProduto_produtoId_quantidadeMinima_key" ON "FaixaPrecoProduto"("produtoId", "quantidadeMinima");

-- AddForeignKey
ALTER TABLE "FaixaPrecoProduto" ADD CONSTRAINT "FaixaPrecoProduto_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "Produto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
