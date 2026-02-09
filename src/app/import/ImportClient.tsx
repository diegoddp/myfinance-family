"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/format";

interface Account {
  id: string;
  name: string;
  currency: string;
}

interface Category {
  id: string;
  name: string;
  group: string;
}

interface ImportRow {
  date: string;
  description: string;
  amount: number;
  currency: string;
  confidence: number;
  isTransfer: boolean;
  categoryId: string | null;
  categoryName: string | null;
  raw: string;
  extra: string[];
  hash: string;
  accountId: string | null;
}

export default function ImportClient({
  accounts,
  categories
}: {
  accounts: Account[];
  categories: Category[];
}) {
  const [file, setFile] = useState<File | null>(null);
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [statementStart, setStatementStart] = useState<string | null>(null);
  const [statementEnd, setStatementEnd] = useState<string | null>(null);

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setMessage(null);
    setWarnings([]);

    const form = new FormData();
    form.append("file", file);
    form.append("accountId", accountId);

    const response = await fetch("/api/import/parse", {
      method: "POST",
      body: form
    });

    const data = await response.json();

    if (!response.ok) {
      setMessage(data.error ?? "Failed to parse PDF");
      setLoading(false);
      return;
    }

    setRows(data.rows);
    setWarnings(data.warnings ?? []);
    setStatementStart(data.statementStart ?? null);
    setStatementEnd(data.statementEnd ?? null);
    setMessage(data.rows.length ? null : "No transactions detected in the PDF.");
    setLoading(false);
  };

  const handleConfirm = async () => {
    if (rows.length === 0) return;
    setLoading(true);
    setMessage(null);

    const response = await fetch("/api/import/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filename: file?.name ?? "statement.pdf",
        source: "AIB",
        statementStart,
        statementEnd,
        rows
      })
    });

    const data = await response.json();

    if (!response.ok) {
      setMessage(data.error ?? "Failed to confirm import");
    } else {
      setMessage(`Inserted ${data.inserted} transactions (skipped ${data.skipped}).`);
      setRows([]);
    }

    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <section className="card p-6">
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="label">Account</label>
            <select
              className="input"
              value={accountId}
              onChange={(event) => setAccountId(event.target.value)}
            >
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="label">PDF Statement</label>
            <input
              className="input"
              type="file"
              accept="application/pdf"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            className="rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white"
            onClick={handleUpload}
            disabled={loading}
          >
            {loading ? "Parsing..." : "Parse PDF"}
          </button>
          <button
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
            onClick={handleConfirm}
            disabled={loading || rows.length === 0}
          >
            Confirm import
          </button>
        </div>
        {message && <p className="mt-3 text-sm text-rose-600">{message}</p>}
        {warnings.length > 0 && (
          <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
            <p className="font-semibold">Parser warnings</p>
            <ul className="list-disc pl-5">
              {warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section className="card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Review Import</h3>
            <p className="text-sm text-slate-500">Adjust any field before confirming.</p>
          </div>
          <span className="badge bg-slate-100 text-slate-600">{rows.length} rows</span>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th className="text-right">Amount</th>
                <th>Category</th>
                <th>Transfer</th>
                <th>Confidence</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-sm text-slate-500">
                    Upload a statement to see transactions here.
                  </td>
                </tr>
              ) : (
                rows.map((row, index) => (
                  <tr key={`${row.hash}-${index}`}>
                    <td>
                      <input
                        className="input w-36"
                        type="date"
                        value={row.date}
                        onChange={(event) => {
                          const next = [...rows];
                          next[index] = { ...row, date: event.target.value };
                          setRows(next);
                        }}
                      />
                    </td>
                    <td className="min-w-[240px]">
                      <input
                        className="input"
                        value={row.description}
                        onChange={(event) => {
                          const next = [...rows];
                          next[index] = { ...row, description: event.target.value };
                          setRows(next);
                        }}
                      />
                      {row.extra.length > 0 && (
                        <p className="mt-1 text-xs text-slate-400">{row.extra.join(" ")}</p>
                      )}
                    </td>
                    <td className="text-right">
                      <input
                        className="input w-32 text-right"
                        type="number"
                        step="0.01"
                        value={row.amount}
                        onChange={(event) => {
                          const next = [...rows];
                          next[index] = { ...row, amount: Number(event.target.value) };
                          setRows(next);
                        }}
                      />
                      <p className={`text-xs ${row.amount >= 0 ? "text-moss" : "text-rose"}`}>
                        {formatCurrency(row.amount)}
                      </p>
                    </td>
                    <td>
                      <select
                        className="input"
                        value={row.categoryId ?? ""}
                        onChange={(event) => {
                          const value = event.target.value || null;
                          const next = [...rows];
                          next[index] = { ...row, categoryId: value };
                          setRows(next);
                        }}
                      >
                        <option value="">Uncategorized</option>
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input
                        type="checkbox"
                        checked={row.isTransfer}
                        onChange={(event) => {
                          const transferCategory = categories.find((cat) => cat.name === "Transfer");
                          const next = [...rows];
                          next[index] = {
                            ...row,
                            isTransfer: event.target.checked,
                            categoryId: event.target.checked ? transferCategory?.id ?? row.categoryId : row.categoryId
                          };
                          setRows(next);
                        }}
                      />
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          row.confidence >= 0.75
                            ? "bg-emerald-100 text-emerald-700"
                            : row.confidence >= 0.5
                            ? "bg-amber-100 text-amber-700"
                            : "bg-rose-100 text-rose-700"
                        }`}
                      >
                        {Math.round(row.confidence * 100)}%
                      </span>
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
