import { NextResponse } from "next/server";
import pdfParse from "pdf-parse";
import { prisma } from "@/lib/prisma";
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

    const accounts = await prisma.account.findMany();
    const categories = await prisma.category.findMany();

    if (accounts.length === 0) {
      return NextResponse.json({ error: "No accounts found. Seed an account first." }, { status: 400 });
    }
    const categoryMap = new Map(categories.map((cat) => [cat.name, cat]));

    const result = parseAibStatementText(pdfData.text, accounts.map((acc) => acc.name));

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
        accountId: accountId ?? (accounts[0]?.id ?? null)
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
