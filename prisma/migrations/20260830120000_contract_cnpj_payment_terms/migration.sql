-- AlterTable
ALTER TABLE "Contract" ADD COLUMN "clientDocType" TEXT NOT NULL DEFAULT 'cpf';

-- AlterTable
ALTER TABLE "Contract" ADD COLUMN "paymentTerms" TEXT;
