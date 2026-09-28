"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export type SearchOption = { id: string; label: string; hint?: string; search: string };

// Free-text input with a filtered suggestion list. Typing never forces a pick, so the
// same box works for "choose an existing one" and "type a new one".
export default function SearchSelect({
  value,
  onChange,
  onPick,
  options,
  placeholder,
  className = "",
  required,
}: {
  value: string;
  onChange: (text: string) => void;
  onPick: (option: SearchOption) => void;
  options: SearchOption[];
  placeholder?: string;
  className?: string;
  required?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);

  const matches = useMemo(() => {
    const q = value.trim().toLowerCase();
    const list = q ? options.filter((o) => o.search.includes(q)) : options;
    return list.slice(0, 12);
  }, [value, options]);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const pick = (o: SearchOption) => {
    onPick(o);
    setOpen(false);
  };

  return (
    <div ref={boxRef} className={`relative ${className}`}>
      <input
        value={value}
        required={required}
        placeholder={placeholder}
        className="input"
        autoComplete="off"
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setActive(0);
        }}
        onKeyDown={(e) => {
          if (!open || matches.length === 0) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((a) => Math.min(a + 1, matches.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((a) => Math.max(a - 1, 0));
          } else if (e.key === "Enter") {
            e.preventDefault();
            pick(matches[active]);
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
      />
      {open && matches.length > 0 && (
        <ul className="absolute z-20 mt-1 max-h-72 w-full min-w-[16rem] overflow-auto rounded-lg border border-sky-100 bg-white py-1 text-sm shadow-lg">
          {matches.map((o, i) => (
            <li key={o.id}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(o)}
                onMouseEnter={() => setActive(i)}
                className={`block w-full px-3 py-2 text-left ${i === active ? "bg-brand-light" : ""}`}
              >
                <span className="block font-medium text-brand-navy">{o.label}</span>
                {o.hint && <span className="block text-xs text-slate-500">{o.hint}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
