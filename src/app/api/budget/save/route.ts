import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { month, items } = body;

    if (!month || !Array.isArray(items)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    for (const item of items) {
      await prisma.budgetItem.upsert({
        where: {
          month_categoryId: {
            month,
            categoryId: item.categoryId
          }
        },
        update: { amount: Number(item.amount) },
        create: { month, categoryId: item.categoryId, amount: Number(item.amount) }
      });
    }

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to save budgets" }, { status: 500 });
  }
}
