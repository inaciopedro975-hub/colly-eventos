-- AlterTable
ALTER TABLE "Quote" ADD COLUMN "clientAddress" TEXT;
ALTER TABLE "Quote" ADD COLUMN "clientDoc" TEXT;
ALTER TABLE "Quote" ADD COLUMN "paymentTerms" TEXT;
ALTER TABLE "Quote" ADD COLUMN "validity" TEXT DEFAULT '30 dias';
