-- CreateTable
CREATE TABLE "ImagemProduto" (
    "id" TEXT NOT NULL,
    "produtoId" TEXT NOT NULL,
    "dados" BYTEA NOT NULL,
    "mimeType" TEXT NOT NULL,
    "nomeArquivo" TEXT,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ImagemProduto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ImagemProduto_produtoId_idx" ON "ImagemProduto"("produtoId");

-- AddForeignKey
ALTER TABLE "ImagemProduto" ADD CONSTRAINT "ImagemProduto_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "Produto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
