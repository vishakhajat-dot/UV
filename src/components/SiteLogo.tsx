"use client";

import { useState } from "react";

export default function SiteLogo({ className = "" }: { className?: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-navy text-lg font-bold text-white ${className}`}>
        MA
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/images/logo.png"
      alt="Mahalaxmi Auto Agency"
      className={`h-10 w-10 shrink-0 rounded-full object-contain ${className}`}
      onError={() => setFailed(true)}
    />
  );
}
