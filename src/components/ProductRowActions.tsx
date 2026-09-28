"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ProductRowActions({ id }: { id: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Delete this item? This cannot be undone.")) return;
    setDeleting(true);
    const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
    if (!res.ok) {
      alert((await res.json().catch(() => ({}))).error || "Could not delete this item.");
      setDeleting(false);
      return;
    }
    router.refresh();
  };

  return (
    <div className="flex gap-3">
      <Link href={`/admin/products/${id}/edit`} className="text-sm font-medium text-brand-primary hover:underline">
        Edit
      </Link>
      <Link href={`/admin/stock?product=${id}`} className="text-sm font-medium text-brand-primary hover:underline">
        Stock
      </Link>
      <button disabled={deleting} onClick={handleDelete} className="text-sm font-medium text-red-600 hover:underline disabled:opacity-50">
        {deleting ? "Deleting..." : "Delete"}
      </button>
    </div>
  );
}
