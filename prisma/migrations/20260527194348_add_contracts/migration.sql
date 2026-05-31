-- CreateTable
CREATE TABLE "Contract" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientName" TEXT NOT NULL,
    "clientCpf" TEXT NOT NULL,
    "clientRg" TEXT,
    "clientAddress" TEXT NOT NULL,
    "eventStart" DATETIME NOT NULL,
    "eventEnd" DATETIME NOT NULL,
    "value" REAL NOT NULL,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'gerado',
    "quoteId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
