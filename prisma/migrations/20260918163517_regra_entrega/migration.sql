-- CreateTable
CREATE TABLE "RegraEntrega" (
    "id" TEXT NOT NULL DEFAULT 'global',
    "valorMinimoEntregaGratuita" DECIMAL(10,2),
    "pesoMinimoEntregaKg" DECIMAL(10,2),
    "raioEntregaGratuitaKm" DECIMAL(10,2),
    "valorPorKmRodado" DECIMAL(10,2),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RegraEntrega_pkey" PRIMARY KEY ("id")
);
