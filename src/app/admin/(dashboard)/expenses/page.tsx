import { prisma } from "@/lib/db";
import { formatDate, rangeFromParams, todayYmd } from "@/lib/dates";
import { formatINR, round2 } from "@/lib/gst";
import DateRangeFilter from "@/components/admin/DateRangeFilter";
import ExpenseForm, { DeleteExpenseButton } from "@/components/admin/ExpenseForm";

export const revalidate = 0;

export default async function ExpensesPage({ searchParams }: { searchParams: { from?: string; to?: string } }) {
  const range = rangeFromParams(searchParams);
  const expenses = await prisma.expense.findMany({
    where: { date: { gte: range.gte, lte: range.lte } },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
  });
  const total = round2(expenses.reduce((s, e) => s + e.amount, 0));
  const byCategory = Array.from(
    expenses.reduce((m, e) => m.set(e.category, (m.get(e.category) ?? 0) + e.amount), new Map<string, number>())
  ).sort((a, b) => b[1] - a[1]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-navy">Expenses</h1>
      <p className="text-sm text-slate-500">Shop running costs. These are subtracted in the Profit &amp; Loss report.</p>

      <div className="mt-6">
        <ExpenseForm today={todayYmd()} />
      </div>

      <div className="card mt-6 p-4">
        <DateRangeFilter from={range.from} to={range.to} basePath="/admin/expenses" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="card overflow-x-auto lg:col-span-2">
          <table className="tabular w-full text-left text-sm">
            <thead className="table-head">
              <tr>
                <th className="px-4 py-2.5">Date</th>
                <th className="px-4 py-2.5">Type</th>
                <th className="px-4 py-2.5">Note</th>
                <th className="px-4 py-2.5 text-right">Amount</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-sky-50">
              {expenses.map((e) => (
                <tr key={e.id}>
                  <td className="px-4 py-2.5 text-slate-600">{formatDate(e.date)}</td>
                  <td className="px-4 py-2.5 font-medium text-brand-navy">{e.category}</td>
                  <td className="px-4 py-2.5 text-slate-600">{e.note || "-"}</td>
                  <td className="px-4 py-2.5 text-right">{formatINR(e.amount)}</td>
                  <td className="px-4 py-2.5 text-right"><DeleteExpenseButton id={e.id} /></td>
                </tr>
              ))}
              {expenses.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-400">No expenses in this period.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="card p-5">
          <h2 className="font-bold text-brand-navy">By type</h2>
          <dl className="tabular mt-3 space-y-2 text-sm">
            {byCategory.map(([cat, amt]) => (
              <div key={cat} className="flex justify-between">
                <dt className="text-slate-600">{cat}</dt>
                <dd className="font-semibold text-brand-navy">{formatINR(round2(amt))}</dd>
              </div>
            ))}
            <div className="flex justify-between border-t border-sky-100 pt-2 text-base">
              <dt className="font-bold text-brand-navy">Total</dt>
              <dd className="font-bold text-brand-navy">{formatINR(total)}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
