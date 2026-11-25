"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export interface FormattedNumberInputProps {
  id: string;
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  allowDecimal?: boolean;
  prefix?: string;
  suffix?: string;
  className?: string;
}

function formatGrouped(num: number, allowDecimal: boolean): string {
  if (!Number.isFinite(num)) return "";
  if (num === 0) return "0";
  if (allowDecimal) {
    return num.toLocaleString("en-US", { maximumFractionDigits: 4 });
  }
  return Math.trunc(num).toLocaleString("id-ID");
}

/**
 * Monospace numeric input displaying thousand separators and optional inline
 * unit prefix/suffix (`Rp`, `%`, `unit`, `bln`) while emitting primitive numbers.
 * Zero values explicitly render as `"0"` so optional inputs never look broken/empty.
 */
export function FormattedNumberInput({
  id,
  value,
  onChange,
  placeholder = "0",
  allowDecimal = false,
  prefix,
  suffix,
  className,
}: FormattedNumberInputProps) {
  const [focused, setFocused] = useState(false);
  const [rawDraft, setRawDraft] = useState("");

  const displayValue = focused
    ? rawDraft
    : formatGrouped(value, allowDecimal);

  const handleFocus = () => {
    setFocused(true);
    setRawDraft(value > 0 ? String(value) : "");
  };

  const handleBlur = () => {
    setFocused(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (allowDecimal) {
      const sanitized = raw.replace(/[^0-9.]/g, "");
      const parts = sanitized.split(".");
      const normalized =
        parts.length > 2
          ? `${parts[0]}.${parts.slice(1).join("")}`
          : sanitized;
      setRawDraft(normalized);
      const parsed = Number.parseFloat(normalized);
      onChange(Number.isFinite(parsed) ? parsed : 0);
      return;
    }

    const digitsOnly = raw.replace(/\D/g, "");
    setRawDraft(digitsOnly);
    const parsed = digitsOnly ? Number.parseInt(digitsOnly, 10) : 0;
    onChange(Number.isFinite(parsed) ? parsed : 0);
  };

  return (
    <div
      className={cn(
        "flex min-h-[44px] w-full items-center rounded-md border border-hairline bg-input shadow-[inset_0_1px_2px_rgba(0,0,0,0.28)] transition-all focus-within:border-cleared/70 focus-within:ring-2 focus-within:ring-cleared/20",
        className
      )}
    >
      {prefix && (
        <span className="select-none pl-3 font-mono text-xs font-semibold text-text-muted">
          {prefix}
        </span>
      )}
      <input
        id={id}
        type="text"
        inputMode={allowDecimal ? "decimal" : "numeric"}
        value={displayValue}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onChange={handleChange}
        placeholder={placeholder}
        className={cn(
          "min-h-[42px] w-full bg-transparent py-2 font-mono text-sm font-semibold tabular-nums text-text-primary placeholder:text-text-muted/60 focus:outline-none sm:text-[14.5px]",
          prefix ? "pl-2" : "pl-3.5",
          suffix ? "pr-2" : "pr-3.5"
        )}
      />
      {suffix && (
        <span className="mr-1.5 select-none rounded-xs border border-hairline/80 bg-surface/80 px-2 py-0.5 font-mono text-[11px] font-medium text-text-secondary">
          {suffix}
        </span>
      )}
    </div>
  );
}
