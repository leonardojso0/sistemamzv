-- CreateEnum
CREATE TYPE "PerfilAdmin" AS ENUM ('ADMIN', 'FINANCEIRO');

-- CreateEnum
CREATE TYPE "StatusCliente" AS ENUM ('ATIVO', 'INADIMPLENTE', 'CANCELADO');

-- CreateEnum
CREATE TYPE "TipoDocumento" AS ENUM ('RG_CPF', 'COMPROVANTE_ENDERECO', 'CONTRATO_ASSINADO', 'OUTRO');

-- CreateEnum
CREATE TYPE "StatusContrato" AS ENUM ('ATIVO', 'CANCELADO', 'SUSPENSO');

-- CreateEnum
CREATE TYPE "StatusConta" AS ENUM ('PENDENTE', 'PAGO', 'ATRASADO');

-- CreateEnum
CREATE TYPE "OrigemConfirmacao" AS ENUM ('MANUAL', 'AUTOMATICO');

-- CreateTable
CREATE TABLE "UsuarioAdmin" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senhaHash" TEXT NOT NULL,
    "perfil" "PerfilAdmin" NOT NULL DEFAULT 'FINANCEIRO',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UsuarioAdmin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cliente" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cpfCnpj" TEXT NOT NULL,
    "email" TEXT,
    "telefone" TEXT,
    "endereco" TEXT,
    "cidade" TEXT,
    "estado" TEXT,
    "cep" TEXT,
    "status" "StatusCliente" NOT NULL DEFAULT 'ATIVO',
    "senhaHash" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentoCliente" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "tipo" "TipoDocumento" NOT NULL,
    "nomeArquivo" TEXT NOT NULL,
    "urlArquivo" TEXT NOT NULL,
    "uploadPorId" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentoCliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Plano" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "velocidade" TEXT NOT NULL,
    "valorMensal" DECIMAL(10,2) NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Plano_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contrato" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "planoId" TEXT NOT NULL,
    "valorImplantacao" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "dataAssinatura" TIMESTAMP(3),
    "status" "StatusContrato" NOT NULL DEFAULT 'ATIVO',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Contrato_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Boleto" (
    "id" TEXT NOT NULL,
    "contratoId" TEXT NOT NULL,
    "mesReferencia" TEXT NOT NULL,
    "nomeArquivo" TEXT NOT NULL,
    "urlArquivo" TEXT NOT NULL,
    "uploadPorId" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Boleto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContaReceber" (
    "id" TEXT NOT NULL,
    "contratoId" TEXT NOT NULL,
    "boletoId" TEXT NOT NULL,
    "mesReferencia" TEXT NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,
    "vencimento" TIMESTAMP(3) NOT NULL,
    "status" "StatusConta" NOT NULL DEFAULT 'PENDENTE',
    "dataPagamento" TIMESTAMP(3),
    "origemConfirmacao" "OrigemConfirmacao",
    "confirmadoPorId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContaReceber_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UsuarioAdmin_email_key" ON "UsuarioAdmin"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Cliente_cpfCnpj_key" ON "Cliente"("cpfCnpj");

-- CreateIndex
CREATE UNIQUE INDEX "ContaReceber_boletoId_key" ON "ContaReceber"("boletoId");

-- AddForeignKey
ALTER TABLE "DocumentoCliente" ADD CONSTRAINT "DocumentoCliente_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentoCliente" ADD CONSTRAINT "DocumentoCliente_uploadPorId_fkey" FOREIGN KEY ("uploadPorId") REFERENCES "UsuarioAdmin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contrato" ADD CONSTRAINT "Contrato_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contrato" ADD CONSTRAINT "Contrato_planoId_fkey" FOREIGN KEY ("planoId") REFERENCES "Plano"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Boleto" ADD CONSTRAINT "Boleto_contratoId_fkey" FOREIGN KEY ("contratoId") REFERENCES "Contrato"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Boleto" ADD CONSTRAINT "Boleto_uploadPorId_fkey" FOREIGN KEY ("uploadPorId") REFERENCES "UsuarioAdmin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContaReceber" ADD CONSTRAINT "ContaReceber_contratoId_fkey" FOREIGN KEY ("contratoId") REFERENCES "Contrato"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContaReceber" ADD CONSTRAINT "ContaReceber_boletoId_fkey" FOREIGN KEY ("boletoId") REFERENCES "Boleto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContaReceber" ADD CONSTRAINT "ContaReceber_confirmadoPorId_fkey" FOREIGN KEY ("confirmadoPorId") REFERENCES "UsuarioAdmin"("id") ON DELETE SET NULL ON UPDATE CASCADE;
