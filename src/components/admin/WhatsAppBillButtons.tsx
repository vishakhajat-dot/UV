"use client";

import { useEffect, useState } from "react";

// Two ways to get the bill to the customer on WhatsApp:
// 1. Share the PDF file itself through the device share sheet (phones, and Windows/Mac
//    with the WhatsApp app). The PDF is fetched in advance because browsers only allow
//    sharing straight after a tap, not after a slow download.
// 2. Open a chat with the customer's number, pre-filled with a secure link to the PDF.
export default function WhatsAppBillButtons({
  pdfUrl,
  fileName,
  phone,
  message,
  linkMessage,
}: {
  pdfUrl: string;
  fileName: string;
  phone: string | null;
  message: string;
  linkMessage: string;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [canShareFile, setCanShareFile] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(pdfUrl)
      .then((r) => (r.ok ? r.blob() : Promise.reject()))
      .then((blob) => {
        if (cancelled) return;
        const f = new File([blob], fileName, { type: "application/pdf" });
        setFile(f);
        setCanShareFile(typeof navigator.canShare === "function" && navigator.canShare({ files: [f] }));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [pdfUrl, fileName]);

  const chatUrl = (text: string) =>
    phone ? `https://wa.me/91${phone}?text=${encodeURIComponent(text)}` : `https://wa.me/?text=${encodeURIComponent(text)}`;

  const sharePdf = async () => {
    setNote(null);
    if (file && canShareFile) {
      try {
        await navigator.share({ files: [file], text: message, title: fileName });
      } catch (err) {
        if ((err as Error)?.name !== "AbortError") setNote("Sharing didn't work here. Use \"Send bill link\" instead.");
      }
      return;
    }
    // No file sharing on this device (usually a desktop browser): save the PDF, open the
    // customer's chat, and they can drag the downloaded file in.
    if (file) {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(file);
      a.download = fileName;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    }
    window.open(chatUrl(message), "_blank", "noopener");
    setNote("This browser can't attach files to WhatsApp directly. The PDF was downloaded; drag it into the chat that opened.");
  };

  return (
    <div className="w-full sm:w-auto">
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={sharePdf} disabled={!file} className="btn-whatsapp disabled:opacity-60">
          {file ? "Send PDF on WhatsApp" : "Preparing PDF..."}
        </button>
        <a href={chatUrl(linkMessage)} target="_blank" rel="noopener noreferrer" className="btn-secondary border-[#25D366] text-[#128C4B]">
          Send bill link on WhatsApp
        </a>
      </div>
      {note && <p className="mt-2 max-w-md text-xs text-amber-800">{note}</p>}
    </div>
  );
}
