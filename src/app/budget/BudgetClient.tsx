"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

interface Category {
  id: string;
  name: string;
  group: string;
}

interface BudgetClientProps {
  monthKey: string;
  categories: Category[];
  budgetItems: Array<{ categoryId: string; amount: number }>;
}

export default function BudgetClient({ monthKey, categories, budgetItems }: BudgetClientProps) {
  const router = useRouter();
  const [month, setMonth] = useState(monthKey);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const fixedCategories = useMemo(
    () => categories.filter((cat) => cat.group === "fixed"),
    [categories]
  );

  const [targets, setTargets] = useState(() =>
    fixedCategories.map((cat) => ({
      categoryId: cat.id,
      name: cat.name,
      amount: budgetItems.find((item) => item.categoryId === cat.id)?.amount ?? 0
    }))
  );

  const handleSave = async () => {
    setSaving(true);
    await fetch("/api/budget/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ month, items: targets })
    });
    setSaving(false);
    setOpen(false);
    router.refresh();
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <label className="text-xs uppercase tracking-wide text-slate-500">Month</label>
      <input
        className="input w-40"
        type="month"
        value={month}
        onChange={(event) => {
          const value = event.target.value;
          setMonth(value);
          router.push(`/budget?month=${value}`);
        }}
      />
      <button
        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:border-slate-400"
        onClick={() => setOpen((prev) => !prev)}
        type="button"
      >
        Edit fixed targets
      </button>

      {open && (
        <div className="w-full rounded-xl border border-slate-200 bg-white p-4 shadow-soft">
          <div className="grid gap-3 md:grid-cols-2">
            {targets.map((target, index) => (
              <div key={target.categoryId}>
                <label className="label">{target.name}</label>
                <input
                  className="input"
                  type="number"
                  step="0.01"
                  value={target.amount}
                  onChange={(event) => {
                    const next = [...targets];
                    next[index] = {
                      ...next[index],
                      amount: Number(event.target.value)
                    };
                    setTargets(next);
                  }}
                />
              </div>
            ))}
          </div>
          <div className="mt-4 flex gap-3">
            <button
              className="rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save targets"}
            </button>
            <button
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
              onClick={() => setOpen(false)}
              type="button"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
