/*
  Warnings:

  - Added the required column `serviceDescription` to the `Contract` table without a default value. This is not possible if the table is not empty.
  - Added the required column `signDate` to the `Contract` table without a default value. This is not possible if the table is not empty.
  - Made the column `clientRg` on table `Contract` required. This step will fail if there are existing NULL values in that column.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Contract" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientName" TEXT NOT NULL,
    "clientCpf" TEXT NOT NULL,
    "clientRg" TEXT NOT NULL,
    "clientAddress" TEXT NOT NULL,
    "eventType" TEXT NOT NULL DEFAULT 'casamento',
    "eventStart" DATETIME NOT NULL,
    "eventEnd" DATETIME NOT NULL,
    "eventLocation" TEXT NOT NULL DEFAULT 'Colly Eventos, em Amparo/SP',
    "serviceDescription" TEXT NOT NULL,
    "value" REAL NOT NULL,
    "paymentSignalPct" REAL NOT NULL DEFAULT 20,
    "paymentInstallments" INTEGER,
    "paymentInstallmentValue" REAL,
    "signCity" TEXT NOT NULL DEFAULT 'Amparo',
    "signDate" DATETIME NOT NULL,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'gerado',
    "quoteId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Contract" ("clientAddress", "clientCpf", "clientName", "clientRg", "createdAt", "eventEnd", "eventStart", "id", "notes", "quoteId", "status", "updatedAt", "value") SELECT "clientAddress", "clientCpf", "clientName", "clientRg", "createdAt", "eventEnd", "eventStart", "id", "notes", "quoteId", "status", "updatedAt", "value" FROM "Contract";
DROP TABLE "Contract";
ALTER TABLE "new_Contract" RENAME TO "Contract";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
