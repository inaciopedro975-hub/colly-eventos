/*
  Warnings:

  - You are about to drop the column `account` on the `Transaction` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Transaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'outros',
    "description" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "date" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'recebido',
    "paymentMethod" TEXT,
    "notes" TEXT,
    "installmentGroup" TEXT,
    "installmentNum" INTEGER,
    "totalInstallments" INTEGER,
    "quoteId" INTEGER,
    "eventId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Transaction" ("amount", "category", "createdAt", "date", "description", "eventId", "id", "notes", "paymentMethod", "quoteId", "type", "updatedAt") SELECT "amount", "category", "createdAt", "date", "description", "eventId", "id", "notes", "paymentMethod", "quoteId", "type", "updatedAt" FROM "Transaction";
DROP TABLE "Transaction";
ALTER TABLE "new_Transaction" RENAME TO "Transaction";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
