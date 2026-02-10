import { db } from "@/lib/db";
import { accounts, categories } from "@/lib/schema";
import ImportClient from "./ImportClient";

export default async function ImportPage() {
  const accountsList = await db.select().from(accounts);
  const categoryList = await db.select().from(categories);

  return (
    <div className="space-y-6">
      <section className="card p-6">
        <h2 className="text-xl font-semibold">Import Bank Statement</h2>
        <p className="text-sm text-slate-500">Upload an AIB PDF statement and review extracted transactions.</p>
      </section>

      <ImportClient accounts={accountsList} categories={categoryList} />
    </div>
  );
}
