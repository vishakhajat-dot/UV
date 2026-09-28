"use client";

import { useState } from "react";

export default function SiteLogo({ className = "h-12" }: { className?: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span className={`flex aspect-[4/3] shrink-0 items-center justify-center rounded-lg bg-brand-navy text-lg font-bold text-white ${className}`}>
        MA
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/images/logo.png"
      alt="Mahalaxmi Auto Agency"
      className={`w-auto shrink-0 rounded-lg object-contain shadow-sm ${className}`}
      onError={() => setFailed(true)}
    />
  );
}
