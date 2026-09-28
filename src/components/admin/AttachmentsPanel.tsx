"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { resizeImage } from "@/lib/resizeImage";

export type Attachment = { id: string; fileName: string; mimeType: string; size: number };

const MAX_PDF = 4 * 1024 * 1024;

// Uploads one file to a purchase bill. Photos are shrunk first; PDFs go as they are.
export async function uploadAttachment(purchaseId: string, file: File) {
  let body: Blob = file;
  let type = file.type;
  let name = file.name;
  if (file.type.startsWith("image/")) {
    body = await resizeImage(file, 1600, 0.82);
    type = "image/jpeg";
    name = name.replace(/\.[^.]+$/, "") + ".jpg";
  } else if (file.type !== "application/pdf") {
    throw new Error(`${file.name}: only photos and PDFs can be attached`);
  } else if (file.size > MAX_PDF) {
    throw new Error(`${file.name}: PDF must be under 4 MB`);
  }
  const res = await fetch(`/api/purchases/${purchaseId}/attachments`, {
    method: "POST",
    headers: { "Content-Type": type, "X-File-Name": encodeURIComponent(name) },
    body,
  });
  if (!res.ok) throw new Error(`${file.name}: ${(await res.json().catch(() => ({}))).error || "upload failed"}`);
}

const kb = (n: number) => (n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

export default function AttachmentsPanel({ purchaseId, attachments }: { purchaseId: string; attachments: Attachment[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    setError(null);
    const problems: string[] = [];
    for (const file of Array.from(files)) {
      try {
        await uploadAttachment(purchaseId, file);
      } catch (err) {
        problems.push(err instanceof Error ? err.message : String(err));
      }
    }
    setBusy(false);
    if (problems.length) setError(problems.join(". "));
    router.refresh();
  };

  const remove = async (a: Attachment) => {
    if (!confirm(`Delete ${a.fileName}?`)) return;
    await fetch(`/api/purchases/attachments/${a.id}`, { method: "DELETE" });
    router.refresh();
  };

  return (
    <div className="card p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-bold text-brand-navy">Vendor bill &amp; receipts</h2>
        <label className={`btn-secondary cursor-pointer px-3 py-1.5 ${busy ? "pointer-events-none opacity-60" : ""}`}>
          {busy ? "Uploading..." : "+ Upload"}
          <input
            type="file"
            multiple
            accept="image/*,application/pdf"
            className="sr-only"
            onChange={(e) => {
              upload(e.target.files);
              e.target.value = "";
            }}
          />
        </label>
      </div>
      <p className="mt-1 text-xs text-slate-500">Photo or PDF of the vendor&apos;s bill, payment receipts, etc.</p>

      <ul className="mt-3 grid gap-3 sm:grid-cols-2">
        {attachments.map((a) => {
          const url = `/api/purchases/attachments/${a.id}`;
          const isImage = a.mimeType.startsWith("image/");
          return (
            <li key={a.id} className="overflow-hidden rounded-lg border border-sky-100">
              <a href={url} target="_blank" rel="noopener noreferrer" className="block h-32 bg-brand-light">
                {isImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={url} alt={a.fileName} className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full items-center justify-center text-sm font-bold text-red-600">PDF</span>
                )}
              </a>
              <div className="flex items-center justify-between gap-2 px-3 py-2 text-xs">
                <span className="min-w-0">
                  <span className="block truncate font-medium text-brand-navy">{a.fileName}</span>
                  <span className="text-slate-500">{kb(a.size)}</span>
                </span>
                <span className="flex shrink-0 gap-2">
                  <a href={`${url}?download=1`} className="font-medium text-brand-primary hover:underline">Save</a>
                  <button onClick={() => remove(a)} className="font-medium text-red-600 hover:underline">Delete</button>
                </span>
              </div>
            </li>
          );
        })}
      </ul>
      {attachments.length === 0 && <p className="mt-3 text-sm text-slate-400">Nothing uploaded yet.</p>}
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </div>
  );
}
