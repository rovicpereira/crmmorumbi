-- CreateEnum
CREATE TYPE "Papel" AS ENUM ('admin', 'atendente');

-- CreateEnum
CREATE TYPE "TipoCliente" AS ENUM ('consumidor_final', 'construtor_profissional');

-- CreateEnum
CREATE TYPE "DirecaoMensagem" AS ENUM ('entrada', 'saida');

-- CreateEnum
CREATE TYPE "TipoMensagem" AS ENUM ('texto', 'imagem', 'audio', 'documento', 'figurinha', 'template', 'outro');

-- CreateEnum
CREATE TYPE "StatusMensagem" AS ENUM ('enviado', 'entregue', 'lido', 'falhou');

-- CreateEnum
CREATE TYPE "StatusLembrete" AS ENUM ('pendente', 'concluido', 'descartado');

-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senhaHash" TEXT NOT NULL,
    "papel" "Papel" NOT NULL DEFAULT 'atendente',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cliente" (
    "id" TEXT NOT NULL,
    "telefoneWhatsapp" TEXT NOT NULL,
    "nome" TEXT,
    "documento" TEXT,
    "tipoCliente" "TipoCliente" NOT NULL DEFAULT 'consumidor_final',
    "endereco" TEXT,
    "observacoes" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EstagioFunil" (
    "id" TEXT NOT NULL,
    "chave" TEXT NOT NULL,
    "rotulo" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL,
    "cor" TEXT NOT NULL DEFAULT '#64748b',
    "final" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "EstagioFunil_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conversa" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "atendenteResponsavelId" TEXT,
    "estagioFunilId" TEXT NOT NULL,
    "ultimaMensagemEm" TIMESTAMP(3),
    "ultimaMensagemInboundEm" TIMESTAMP(3),
    "naoLidas" INTEGER NOT NULL DEFAULT 0,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Conversa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HistoricoEstagio" (
    "id" TEXT NOT NULL,
    "conversaId" TEXT NOT NULL,
    "estagioAnteriorId" TEXT,
    "estagioNovoId" TEXT NOT NULL,
    "usuarioId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HistoricoEstagio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mensagem" (
    "id" TEXT NOT NULL,
    "conversaId" TEXT NOT NULL,
    "direcao" "DirecaoMensagem" NOT NULL,
    "usuarioId" TEXT,
    "whatsappMessageId" TEXT,
    "tipo" "TipoMensagem" NOT NULL DEFAULT 'texto',
    "texto" TEXT,
    "templateNome" TEXT,
    "status" "StatusMensagem" NOT NULL DEFAULT 'enviado',
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Mensagem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Midia" (
    "id" TEXT NOT NULL,
    "mensagemId" TEXT NOT NULL,
    "whatsappMediaId" TEXT,
    "mimeType" TEXT,
    "caminhoArmazenamento" TEXT,
    "tamanhoBytes" INTEGER,
    "baixadoEm" TIMESTAMP(3),

    CONSTRAINT "Midia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lembrete" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "conversaId" TEXT,
    "criadoPorUsuarioId" TEXT,
    "atendenteResponsavelId" TEXT,
    "titulo" TEXT NOT NULL,
    "nota" TEXT,
    "dataVencimento" TIMESTAMP(3) NOT NULL,
    "status" "StatusLembrete" NOT NULL DEFAULT 'pendente',
    "origemAutomatica" BOOLEAN NOT NULL DEFAULT false,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Lembrete_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TemplateWhatsapp" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "idioma" TEXT NOT NULL DEFAULT 'pt_BR',
    "categoria" TEXT NOT NULL,
    "variaveisEsperadas" INTEGER NOT NULL DEFAULT 0,
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "TemplateWhatsapp_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Cliente_telefoneWhatsapp_key" ON "Cliente"("telefoneWhatsapp");

-- CreateIndex
CREATE UNIQUE INDEX "EstagioFunil_chave_key" ON "EstagioFunil"("chave");

-- CreateIndex
CREATE INDEX "Conversa_atendenteResponsavelId_idx" ON "Conversa"("atendenteResponsavelId");

-- CreateIndex
CREATE INDEX "Conversa_estagioFunilId_idx" ON "Conversa"("estagioFunilId");

-- CreateIndex
CREATE UNIQUE INDEX "Mensagem_whatsappMessageId_key" ON "Mensagem"("whatsappMessageId");

-- CreateIndex
CREATE INDEX "Mensagem_conversaId_idx" ON "Mensagem"("conversaId");

-- CreateIndex
CREATE UNIQUE INDEX "Midia_mensagemId_key" ON "Midia"("mensagemId");

-- CreateIndex
CREATE INDEX "Lembrete_atendenteResponsavelId_idx" ON "Lembrete"("atendenteResponsavelId");

-- CreateIndex
CREATE INDEX "Lembrete_status_idx" ON "Lembrete"("status");

-- CreateIndex
CREATE UNIQUE INDEX "TemplateWhatsapp_nome_key" ON "TemplateWhatsapp"("nome");

-- AddForeignKey
ALTER TABLE "Conversa" ADD CONSTRAINT "Conversa_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversa" ADD CONSTRAINT "Conversa_atendenteResponsavelId_fkey" FOREIGN KEY ("atendenteResponsavelId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversa" ADD CONSTRAINT "Conversa_estagioFunilId_fkey" FOREIGN KEY ("estagioFunilId") REFERENCES "EstagioFunil"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistoricoEstagio" ADD CONSTRAINT "HistoricoEstagio_conversaId_fkey" FOREIGN KEY ("conversaId") REFERENCES "Conversa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistoricoEstagio" ADD CONSTRAINT "HistoricoEstagio_estagioAnteriorId_fkey" FOREIGN KEY ("estagioAnteriorId") REFERENCES "EstagioFunil"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistoricoEstagio" ADD CONSTRAINT "HistoricoEstagio_estagioNovoId_fkey" FOREIGN KEY ("estagioNovoId") REFERENCES "EstagioFunil"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistoricoEstagio" ADD CONSTRAINT "HistoricoEstagio_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mensagem" ADD CONSTRAINT "Mensagem_conversaId_fkey" FOREIGN KEY ("conversaId") REFERENCES "Conversa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mensagem" ADD CONSTRAINT "Mensagem_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Midia" ADD CONSTRAINT "Midia_mensagemId_fkey" FOREIGN KEY ("mensagemId") REFERENCES "Mensagem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lembrete" ADD CONSTRAINT "Lembrete_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lembrete" ADD CONSTRAINT "Lembrete_conversaId_fkey" FOREIGN KEY ("conversaId") REFERENCES "Conversa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lembrete" ADD CONSTRAINT "Lembrete_criadoPorUsuarioId_fkey" FOREIGN KEY ("criadoPorUsuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lembrete" ADD CONSTRAINT "Lembrete_atendenteResponsavelId_fkey" FOREIGN KEY ("atendenteResponsavelId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
