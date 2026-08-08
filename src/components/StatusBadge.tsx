const COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400",
  CONFIRMED: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
  FULFILLED: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400",
  CANCELLED: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
  UNPAID: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
  PAID: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400",
};

export default function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${COLORS[status] || "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"}`}>
      {status}
    </span>
  );
}
