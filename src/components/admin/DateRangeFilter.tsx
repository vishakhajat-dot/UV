import Link from "next/link";

// Plain GET form, so the chosen range lives in the URL and survives refreshes.
export default function DateRangeFilter({
  from,
  to,
  basePath,
  extra,
}: {
  from: string;
  to: string;
  basePath: string;
  extra?: React.ReactNode;
}) {
  return (
    <form action={basePath} className="no-print flex flex-wrap items-end gap-3">
      <div>
        <label className="label">From</label>
        <input type="date" name="from" defaultValue={from} className="input" />
      </div>
      <div>
        <label className="label">To</label>
        <input type="date" name="to" defaultValue={to} className="input" />
      </div>
      {extra}
      <button type="submit" className="btn-primary">Apply</button>
      <Link href={basePath} className="pb-2.5 text-sm font-medium text-brand-primary hover:underline">
        This month
      </Link>
    </form>
  );
}
