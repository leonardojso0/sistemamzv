-- AlterTable
ALTER TABLE "UsuarioAdmin" ADD COLUMN     "master" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "MovimentacaoConta" (
    "id" TEXT NOT NULL,
    "contaReceberId" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "realizadoPorId" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MovimentacaoConta_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "MovimentacaoConta" ADD CONSTRAINT "MovimentacaoConta_contaReceberId_fkey" FOREIGN KEY ("contaReceberId") REFERENCES "ContaReceber"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimentacaoConta" ADD CONSTRAINT "MovimentacaoConta_realizadoPorId_fkey" FOREIGN KEY ("realizadoPorId") REFERENCES "UsuarioAdmin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
