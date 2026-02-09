import { prisma } from "@/lib/prisma";
import ImportClient from "./ImportClient";

export default async function ImportPage() {
  const [accounts, categories] = await Promise.all([
    prisma.account.findMany({ orderBy: { name: "asc" } }),
    prisma.category.findMany({ orderBy: { name: "asc" } })
  ]);

  return (
    <div className="space-y-6">
      <section className="card p-6">
        <h2 className="text-xl font-semibold">Import Bank Statement</h2>
        <p className="text-sm text-slate-500">Upload an AIB PDF statement and review extracted transactions.</p>
      </section>

      <ImportClient accounts={accounts} categories={categories} />
    </div>
  );
}
