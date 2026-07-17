-- DropForeignKey
ALTER TABLE "MovimentacaoConta" DROP CONSTRAINT "MovimentacaoConta_realizadoPorId_fkey";

-- AlterTable
ALTER TABLE "MovimentacaoConta" ALTER COLUMN "realizadoPorId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "MovimentacaoConta" ADD CONSTRAINT "MovimentacaoConta_realizadoPorId_fkey" FOREIGN KEY ("realizadoPorId") REFERENCES "UsuarioAdmin"("id") ON DELETE SET NULL ON UPDATE CASCADE;
