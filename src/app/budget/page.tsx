import { prisma } from "@/lib/prisma";
import { formatCurrency, formatMonthLabel, getMonthKey } from "@/lib/format";
import BudgetClient from "./BudgetClient";

function getMonthRange(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59, 999);
  return { start, end };
}

export default async function BudgetPage({
  searchParams
}: {
  searchParams: { month?: string };
}) {
  const monthKey = searchParams.month ?? getMonthKey();
  const { start, end } = getMonthRange(monthKey);

  const [categories, transactions, budgets] = await Promise.all([
    prisma.category.findMany({ orderBy: { group: "asc" } }),
    prisma.transaction.findMany({
      where: { date: { gte: start, lte: end } },
      include: { category: true }
    }),
    prisma.budgetItem.findMany({ where: { month: monthKey } })
  ]);

  const budgetItems = budgets.map((item) => ({
    categoryId: item.categoryId,
    amount: item.amount
  }));

  const totals = transactions.reduce(
    (acc, tx) => {
      const group = tx.category?.group ?? "variable";
      if (group === "income") acc.income += tx.amount;
      if (group === "fixed") acc.fixed += Math.abs(tx.amount);
      if (group === "variable") acc.variable += Math.abs(tx.amount);
      return acc;
    },
    { income: 0, fixed: 0, variable: 0 }
  );

  const net = totals.income - totals.fixed - totals.variable;

  return (
    <div className="space-y-8">
      <section className="card p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">Budget for {formatMonthLabel(monthKey)}</h2>
            <p className="text-sm text-slate-500">Track fixed and variable spend against your plan.</p>
          </div>
          <BudgetClient monthKey={monthKey} categories={categories} budgetItems={budgetItems} />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <div className="card p-5">
          <p className="label">Income</p>
          <p className="mt-2 text-lg font-semibold text-moss">{formatCurrency(totals.income)}</p>
        </div>
        <div className="card p-5">
          <p className="label">Fixed</p>
          <p className="mt-2 text-lg font-semibold text-rose">{formatCurrency(totals.fixed)}</p>
        </div>
        <div className="card p-5">
          <p className="label">Variable</p>
          <p className="mt-2 text-lg font-semibold text-amber">{formatCurrency(totals.variable)}</p>
        </div>
        <div className="card p-5">
          <p className="label">Net</p>
          <p className={`mt-2 text-lg font-semibold ${net >= 0 ? "text-moss" : "text-rose"}`}>
            {formatCurrency(net)}
          </p>
        </div>
      </section>

      <section className="card p-6">
        <h3 className="text-lg font-semibold">Fixed Cost Plan</h3>
        <p className="text-sm text-slate-500">Set targets for fixed categories. Editable inline.</p>
        <div className="mt-4 overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Category</th>
                <th className="text-right">Target</th>
                <th className="text-right">Actual</th>
              </tr>
            </thead>
            <tbody>
              {categories
                .filter((cat) => cat.group === "fixed")
                .map((cat) => {
                  const actual = transactions
                    .filter((tx) => tx.categoryId === cat.id)
                    .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
                  const planned = budgetItems.find((item) => item.categoryId === cat.id)?.amount ?? 0;
                  return (
                    <tr key={cat.id}>
                      <td>{cat.name}</td>
                      <td className="text-right">{formatCurrency(planned)}</td>
                      <td className="text-right">{formatCurrency(actual)}</td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card p-6">
        <h3 className="text-lg font-semibold">Variable Costs By Category</h3>
        <div className="mt-4 overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Category</th>
                <th className="text-right">Actual</th>
              </tr>
            </thead>
            <tbody>
              {categories
                .filter((cat) => cat.group === "variable")
                .map((cat) => {
                  const actual = transactions
                    .filter((tx) => tx.categoryId === cat.id)
                    .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
                  return (
                    <tr key={cat.id}>
                      <td>{cat.name}</td>
                      <td className="text-right">{formatCurrency(actual)}</td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
