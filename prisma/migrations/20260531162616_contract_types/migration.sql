-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Contract" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL DEFAULT 'decoracao',
    "clientName" TEXT NOT NULL,
    "clientCpf" TEXT NOT NULL,
    "clientRg" TEXT NOT NULL,
    "clientAddress" TEXT NOT NULL,
    "eventType" TEXT NOT NULL DEFAULT 'casamento',
    "eventStart" DATETIME NOT NULL,
    "eventEnd" DATETIME NOT NULL,
    "eventLocation" TEXT NOT NULL DEFAULT 'Colly Eventos, em Amparo/SP',
    "serviceDescription" TEXT,
    "value" REAL NOT NULL,
    "paymentSignalPct" REAL NOT NULL DEFAULT 20,
    "paymentInstallments" INTEGER,
    "paymentInstallmentValue" REAL,
    "extraHourValue" REAL,
    "signCity" TEXT NOT NULL DEFAULT 'Amparo',
    "signDate" DATETIME NOT NULL,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'gerado',
    "quoteId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Contract" ("clientAddress", "clientCpf", "clientName", "clientRg", "createdAt", "eventEnd", "eventLocation", "eventStart", "eventType", "id", "notes", "paymentInstallmentValue", "paymentInstallments", "paymentSignalPct", "quoteId", "serviceDescription", "signCity", "signDate", "status", "updatedAt", "value") SELECT "clientAddress", "clientCpf", "clientName", "clientRg", "createdAt", "eventEnd", "eventLocation", "eventStart", "eventType", "id", "notes", "paymentInstallmentValue", "paymentInstallments", "paymentSignalPct", "quoteId", "serviceDescription", "signCity", "signDate", "status", "updatedAt", "value" FROM "Contract";
DROP TABLE "Contract";
ALTER TABLE "new_Contract" RENAME TO "Contract";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
