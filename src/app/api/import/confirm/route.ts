import { NextResponse } from "next/server";
import { inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { importFiles, transactions } from "@/lib/schema";
import { computeHash } from "@/lib/aibParser";
import { createId } from "@/lib/id";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { filename, source, statementStart, statementEnd, rows } = body;

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: "No rows provided" }, { status: 400 });
    }

    const importId = createId("imp");

    await db.insert(importFiles).values({
      id: importId,
      filename: filename ?? "statement.pdf",
      source: source ?? "AIB",
      uploadedAt: new Date(),
      statementStart: statementStart ? new Date(statementStart) : null,
      statementEnd: statementEnd ? new Date(statementEnd) : null
    });

    const computedHashes = rows.map((row: any) =>
      computeHash(row.date, row.description, Number(row.amount), row.accountId, row.currency ?? "EUR")
    );

    const existing = computedHashes.length
      ? await db.select({ hash: transactions.hash }).from(transactions).where(inArray(transactions.hash, computedHashes))
      : [];

    const existingHashes = new Set(existing.map((item) => item.hash));

    const insertRows = [];
    let skipped = 0;

    for (const row of rows) {
      if (!row.accountId) {
        return NextResponse.json({ error: "Missing accountId for a transaction row." }, { status: 400 });
      }

      const hash = computeHash(row.date, row.description, Number(row.amount), row.accountId, row.currency ?? "EUR");

      if (existingHashes.has(hash)) {
        skipped += 1;
        continue;
      }

      insertRows.push({
        id: createId("txn"),
        date: new Date(row.date),
        description: row.description,
        amount: Number(row.amount),
        currency: row.currency ?? "EUR",
        accountId: row.accountId,
        categoryId: row.categoryId ?? null,
        isTransfer: Boolean(row.isTransfer),
        importId,
        hash,
        metadata: row.extra?.length ? JSON.stringify(row.extra) : null,
        createdAt: new Date()
      });
    }

    if (insertRows.length > 0) {
      await db.insert(transactions).values(insertRows);
    }

    return NextResponse.json({
      inserted: insertRows.length,
      skipped,
      importId
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to confirm import" }, { status: 500 });
  }
}
