import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeHash } from "@/lib/aibParser";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { filename, source, statementStart, statementEnd, rows } = body;

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: "No rows provided" }, { status: 400 });
    }

    const importFile = await prisma.importFile.create({
      data: {
        filename: filename ?? "statement.pdf",
        source: source ?? "AIB",
        statementStart: statementStart ? new Date(statementStart) : undefined,
        statementEnd: statementEnd ? new Date(statementEnd) : undefined
      }
    });

    const computedHashes = rows.map((row: any) =>
      computeHash(row.date, row.description, Number(row.amount), row.accountId, row.currency ?? "EUR")
    );

    const existingHashes = new Set(
      (
        await prisma.transaction.findMany({
          where: { hash: { in: computedHashes } },
          select: { hash: true }
        })
      ).map((item) => item.hash)
    );

    let inserted = 0;
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

      await prisma.transaction.create({
        data: {
          date: new Date(row.date),
          description: row.description,
          amount: Number(row.amount),
          currency: row.currency ?? "EUR",
          accountId: row.accountId,
          categoryId: row.categoryId ?? null,
          isTransfer: Boolean(row.isTransfer),
          importId: importFile.id,
          hash,
          metadata: row.extra?.length ? JSON.stringify(row.extra) : undefined
        }
      });

      inserted += 1;
    }

    return NextResponse.json({
      inserted,
      skipped,
      importId: importFile.id
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to confirm import" }, { status: 500 });
  }
}
