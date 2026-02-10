import { sqliteTable, text, integer, real, uniqueIndex } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull()
});

export const accounts = sqliteTable("account", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  institution: text("institution").notNull(),
  owner: text("owner").notNull(),
  type: text("type").notNull(),
  currency: text("currency").notNull(),
  balance: real("balance").default(0),
  userId: text("userId")
});

export const categories = sqliteTable(
  "category",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    group: text("group").notNull()
  },
  (table) => ({
    nameUnique: uniqueIndex("category_name_unique").on(table.name)
  })
);

export const importFiles = sqliteTable("import_file", {
  id: text("id").primaryKey(),
  filename: text("filename").notNull(),
  uploadedAt: integer("uploadedAt", { mode: "timestamp" }).notNull(),
  source: text("source").notNull(),
  statementStart: integer("statementStart", { mode: "timestamp" }),
  statementEnd: integer("statementEnd", { mode: "timestamp" })
});

export const transactions = sqliteTable(
  "transaction",
  {
    id: text("id").primaryKey(),
    date: integer("date", { mode: "timestamp" }).notNull(),
    description: text("description").notNull(),
    amount: real("amount").notNull(),
    currency: text("currency").notNull(),
    accountId: text("accountId").notNull(),
    categoryId: text("categoryId"),
    isTransfer: integer("isTransfer", { mode: "boolean" }).notNull().default(false),
    importId: text("importId"),
    hash: text("hash").notNull(),
    metadata: text("metadata"),
    createdAt: integer("createdAt", { mode: "timestamp" }).notNull()
  },
  (table) => ({
    hashUnique: uniqueIndex("transaction_hash_unique").on(table.hash)
  })
);

export const budgetItems = sqliteTable(
  "budget_item",
  {
    id: text("id").primaryKey(),
    month: text("month").notNull(),
    amount: real("amount").notNull(),
    categoryId: text("categoryId").notNull(),
    createdAt: integer("createdAt", { mode: "timestamp" }).notNull()
  },
  (table) => ({
    monthCategoryUnique: uniqueIndex("budget_month_category_unique").on(table.month, table.categoryId)
  })
);
