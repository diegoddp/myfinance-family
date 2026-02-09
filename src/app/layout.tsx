import "@/styles/globals.css";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "MyFinance Family",
  description: "Local-first family finance manager"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
          <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
            <div className="container-page flex items-center justify-between py-4">
              <div>
                <h1 className="text-lg font-semibold">MyFinance Family</h1>
                <p className="text-xs text-slate-500">Local-first money dashboard</p>
              </div>
              <nav className="flex gap-4 text-sm font-medium text-slate-600">
                <Link className="hover:text-ink" href="/">Dashboard</Link>
                <Link className="hover:text-ink" href="/budget">Budget</Link>
                <Link className="hover:text-ink" href="/import">Import</Link>
              </nav>
            </div>
          </header>
          <main className="container-page">{children}</main>
        </div>
      </body>
    </html>
  );
}
