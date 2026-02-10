CREATE TABLE IF NOT EXISTS "user" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "name" TEXT NOT NULL,
  "createdAt" INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS "account" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "name" TEXT NOT NULL,
  "institution" TEXT NOT NULL,
  "owner" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "currency" TEXT NOT NULL,
  "balance" REAL DEFAULT 0,
  "userId" TEXT
);

CREATE TABLE IF NOT EXISTS "category" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "name" TEXT NOT NULL,
  "group" TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS "import_file" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "filename" TEXT NOT NULL,
  "uploadedAt" INTEGER NOT NULL,
  "source" TEXT NOT NULL,
  "statementStart" INTEGER,
  "statementEnd" INTEGER
);

CREATE TABLE IF NOT EXISTS "transaction" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "date" INTEGER NOT NULL,
  "description" TEXT NOT NULL,
  "amount" REAL NOT NULL,
  "currency" TEXT NOT NULL,
  "accountId" TEXT NOT NULL,
  "categoryId" TEXT,
  "isTransfer" INTEGER NOT NULL DEFAULT 0,
  "importId" TEXT,
  "hash" TEXT NOT NULL,
  "metadata" TEXT,
  "createdAt" INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS "budget_item" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "month" TEXT NOT NULL,
  "amount" REAL NOT NULL,
  "categoryId" TEXT NOT NULL,
  "createdAt" INTEGER NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "category_name_unique" ON "category" ("name");
CREATE UNIQUE INDEX IF NOT EXISTS "transaction_hash_unique" ON "transaction" ("hash");
CREATE UNIQUE INDEX IF NOT EXISTS "budget_month_category_unique" ON "budget_item" ("month", "categoryId");
