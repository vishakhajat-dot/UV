"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ProductRowActions({ id }: { id: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Delete this product? This cannot be undone.")) return;
    setDeleting(true);
    await fetch(`/api/products/${id}`, { method: "DELETE" });
    router.refresh();
  };

  return (
    <div className="flex gap-3">
      <Link href={`/admin/products/${id}/edit`} className="text-sm font-medium text-brand-navy hover:underline dark:text-brand-gold">
        Edit
      </Link>
      <button disabled={deleting} onClick={handleDelete} className="text-sm font-medium text-brand-red hover:underline disabled:opacity-50">
        {deleting ? "Deleting..." : "Delete"}
      </button>
    </div>
  );
}
