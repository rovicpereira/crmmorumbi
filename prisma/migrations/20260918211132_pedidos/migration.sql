-- CreateTable
CREATE TABLE "Pedido" (
    "id" TEXT NOT NULL,
    "numero" SERIAL NOT NULL,
    "orcamentoId" TEXT NOT NULL,
    "expedicaoConfirmada" BOOLEAN NOT NULL DEFAULT false,
    "expedicaoConfirmadaEm" TIMESTAMP(3),
    "clienteConfirmouData" BOOLEAN NOT NULL DEFAULT false,
    "clienteConfirmouDataEm" TIMESTAMP(3),
    "dataEntregaCombinada" TIMESTAMP(3),
    "faturado" BOOLEAN NOT NULL DEFAULT false,
    "faturadoEm" TIMESTAMP(3),
    "baixadoCaixa" BOOLEAN NOT NULL DEFAULT false,
    "baixadoCaixaEm" TIMESTAMP(3),
    "entregaAgendada" BOOLEAN NOT NULL DEFAULT false,
    "entregaAgendadaEm" TIMESTAMP(3),
    "cancelado" BOOLEAN NOT NULL DEFAULT false,
    "observacoes" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pedido_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Pedido_numero_key" ON "Pedido"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "Pedido_orcamentoId_key" ON "Pedido"("orcamentoId");

-- AddForeignKey
ALTER TABLE "Pedido" ADD CONSTRAINT "Pedido_orcamentoId_fkey" FOREIGN KEY ("orcamentoId") REFERENCES "Orcamento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
