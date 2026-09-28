"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeletePurchaseButton({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button
      disabled={busy}
      className="btn-danger"
      onClick={async () => {
        if (!confirm("Delete this purchase? Its items are taken back out of stock and its uploaded files are deleted.")) return;
        setBusy(true);
        const res = await fetch(`/api/purchases/${id}`, { method: "DELETE" });
        if (!res.ok) {
          alert("Could not delete this purchase.");
          setBusy(false);
          return;
        }
        router.push("/admin/purchases");
        router.refresh();
      }}
    >
      {busy ? "Deleting..." : "Delete Purchase"}
    </button>
  );
}
