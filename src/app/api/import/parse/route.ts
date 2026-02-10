import { NextResponse } from "next/server";
import pdfParse from "pdf-parse";
import { db } from "@/lib/db";
import { accounts, categories } from "@/lib/schema";
import { parseAibStatementText } from "@/lib/aibParser";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const accountId = (formData.get("accountId") as string | null) ?? undefined;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const pdfData = await pdfParse(buffer);

    const accountRows = await db.select().from(accounts);
    const categoryRows = await db.select().from(categories);

    if (accountRows.length === 0) {
      return NextResponse.json({ error: "No accounts found. Seed an account first." }, { status: 400 });
    }

    const categoryMap = new Map(categoryRows.map((cat) => [cat.name, cat]));

    const result = parseAibStatementText(pdfData.text, accountRows.map((acc) => acc.name));

    const rows = result.transactions.map((tx) => {
      const transferCategory = categoryMap.get("Transfer") ?? null;
      const matchedCategory = tx.categoryName ? categoryMap.get(tx.categoryName) : null;
      const category = tx.isTransfer ? transferCategory : matchedCategory;

      return {
        date: tx.date,
        description: tx.description,
        amount: tx.amount,
        currency: tx.currency,
        confidence: tx.confidence,
        isTransfer: tx.isTransfer,
        categoryId: category?.id ?? null,
        categoryName: category?.name ?? null,
        raw: tx.raw,
        extra: tx.extra ?? [],
        hash: tx.hash,
        accountId: accountId ?? accountRows[0]?.id ?? null
      };
    });

    return NextResponse.json({
      filename: file.name,
      statementStart: result.statementStart,
      statementEnd: result.statementEnd,
      warnings: result.warnings,
      rows
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to parse PDF" }, { status: 500 });
  }
}
