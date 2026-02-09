import { prisma } from "@/lib/prisma";
import { formatCurrency, getMonthKey } from "@/lib/format";

function getMonthRange(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59, 999);
  return { start, end };
}

export default async function DashboardPage() {
  const monthKey = getMonthKey();
  const { start, end } = getMonthRange(monthKey);

  const [transactions, categories, accounts] = await Promise.all([
    prisma.transaction.findMany({
      orderBy: { date: "desc" },
      take: 8,
      include: { category: true, account: true }
    }),
    prisma.category.findMany(),
    prisma.account.findMany()
  ]);

  const monthTransactions = await prisma.transaction.findMany({
    where: {
      date: {
        gte: start,
        lte: end
      }
    },
    include: { category: true }
  });

  const totals = monthTransactions.reduce(
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
  const netWorthFromBalances = accounts.reduce((sum, acc) => sum + (acc.balance ?? 0), 0);
  const netWorthFallback = accounts.length
    ? netWorthFromBalances
    : (await prisma.transaction.aggregate({ _sum: { amount: true } }))._sum.amount ?? 0;

  return (
    <div className="space-y-8">
      <section className="grid gap-4 md:grid-cols-3">
        <div className="card p-6">
          <p className="label">Net Worth</p>
          <h2 className="mt-2 text-2xl font-semibold">{formatCurrency(netWorthFallback)}</h2>
          <p className="mt-1 text-xs text-slate-500">Based on account balances or cumulative activity.</p>
        </div>
        <div className="card p-6">
          <p className="label">Monthly Income</p>
          <h2 className="mt-2 text-2xl font-semibold text-moss">{formatCurrency(totals.income)}</h2>
          <p className="mt-1 text-xs text-slate-500">Current month total</p>
        </div>
        <div className="card p-6">
          <p className="label">Monthly Net</p>
          <h2 className={`mt-2 text-2xl font-semibold ${net >= 0 ? "text-moss" : "text-rose"}`}>
            {formatCurrency(net)}
          </h2>
          <p className="mt-1 text-xs text-slate-500">Income minus fixed and variable.</p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="card p-6">
          <p className="label">Fixed Costs</p>
          <h3 className="mt-2 text-xl font-semibold text-rose">{formatCurrency(totals.fixed)}</h3>
        </div>
        <div className="card p-6">
          <p className="label">Variable Costs</p>
          <h3 className="mt-2 text-xl font-semibold text-amber">{formatCurrency(totals.variable)}</h3>
        </div>
        <div className="card p-6">
          <p className="label">Active Categories</p>
          <h3 className="mt-2 text-xl font-semibold">{categories.length}</h3>
          <p className="mt-1 text-xs text-slate-500">Ready for classification.</p>
        </div>
      </section>

      <section className="card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Recent Transactions</h3>
            <p className="text-sm text-slate-500">Latest activity across accounts.</p>
          </div>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Account</th>
                <th>Category</th>
                <th className="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-sm text-slate-500">
                    No transactions yet. Import a statement to get started.
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.id}>
                    <td>{tx.date.toISOString().slice(0, 10)}</td>
                    <td className="max-w-xs">
                      <p className="font-medium text-slate-700">{tx.description}</p>
                    </td>
                    <td>{tx.account.name}</td>
                    <td>{tx.category?.name ?? "Uncategorized"}</td>
                    <td className={`text-right font-semibold ${tx.amount >= 0 ? "text-moss" : "text-rose"}`}>
                      {formatCurrency(tx.amount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
