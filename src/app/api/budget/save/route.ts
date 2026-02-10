import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { budgetItems } from "@/lib/schema";
import { createId } from "@/lib/id";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { month, items } = body;

    if (!month || !Array.isArray(items)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    for (const item of items) {
      await db
        .insert(budgetItems)
        .values({
          id: createId("bud"),
          month,
          categoryId: item.categoryId,
          amount: Number(item.amount),
          createdAt: new Date()
        })
        .onConflictDoUpdate({
          target: [budgetItems.month, budgetItems.categoryId],
          set: { amount: Number(item.amount) }
        });
    }

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to save budgets" }, { status: 500 });
  }
}
