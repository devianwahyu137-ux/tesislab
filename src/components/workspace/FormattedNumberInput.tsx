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
  if (!Number.isFinite(num) || num === 0) return "";
  if (allowDecimal) {
    return num.toLocaleString("en-US", { maximumFractionDigits: 4 });
  }
  return Math.trunc(num).toLocaleString("id-ID");
}

/**
 * Monospace numeric input displaying thousand separators and optional inline
 * unit prefix/suffix (`Rp`, `%`, `unit`, `bln`) while emitting primitive numbers.
 */
export function FormattedNumberInput({
  id,
  value,
  onChange,
  placeholder,
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
        "flex min-h-[44px] w-full items-center rounded-sm border border-hairline bg-input transition-colors focus-within:border-active-border focus-within:ring-1 focus-within:ring-cleared",
        className
      )}
    >
      {prefix && (
        <span className="select-none pl-3 font-mono text-xs text-ink-muted">
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
          "min-h-[42px] w-full bg-transparent py-2 font-mono text-sm tabular-nums text-ink-primary placeholder:text-ink-muted focus:outline-none",
          prefix ? "pl-1.5" : "pl-3",
          suffix ? "pr-1.5" : "pr-3"
        )}
      />
      {suffix && (
        <span className="select-none pr-3 font-mono text-xs text-ink-muted">
          {suffix}
        </span>
      )}
    </div>
  );
}
