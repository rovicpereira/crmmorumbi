-- CreateTable
CREATE TABLE "DiretrizComercial" (
    "id" TEXT NOT NULL,
    "categoriaId" TEXT NOT NULL,
    "descontoMaximoPercentual" DECIMAL(5,2),
    "valorMaximoAutonomo" DECIMAL(10,2),
    "formasPagamentoAceitas" TEXT,
    "regrasLivres" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiretrizComercial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiretrizComercialTemporaria" (
    "id" TEXT NOT NULL,
    "categoriaId" TEXT NOT NULL,
    "descontoMaximoPercentual" DECIMAL(5,2),
    "valorMaximoAutonomo" DECIMAL(10,2),
    "formasPagamentoAceitas" TEXT,
    "regrasLivres" TEXT,
    "dataInicio" TIMESTAMP(3) NOT NULL,
    "dataFim" TIMESTAMP(3) NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DiretrizComercialTemporaria_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DiretrizComercial_categoriaId_key" ON "DiretrizComercial"("categoriaId");

-- CreateIndex
CREATE INDEX "DiretrizComercialTemporaria_categoriaId_idx" ON "DiretrizComercialTemporaria"("categoriaId");

-- CreateIndex
CREATE INDEX "DiretrizComercialTemporaria_dataInicio_dataFim_idx" ON "DiretrizComercialTemporaria"("dataInicio", "dataFim");

-- CreateIndex
CREATE UNIQUE INDEX "DiretrizComercialTemporaria_categoriaId_dataInicio_dataFim_key" ON "DiretrizComercialTemporaria"("categoriaId", "dataInicio", "dataFim");

-- AddForeignKey
ALTER TABLE "DiretrizComercial" ADD CONSTRAINT "DiretrizComercial_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "CategoriaProduto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiretrizComercialTemporaria" ADD CONSTRAINT "DiretrizComercialTemporaria_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "CategoriaProduto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
