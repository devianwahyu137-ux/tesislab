"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export interface FormattedNumberInputProps {
  id: string;
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  allowDecimal?: boolean;
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
 * Monospace numeric input displaying thousand separators while emitting
 * clean primitive `number` values to form state.
 */
export function FormattedNumberInput({
  id,
  value,
  onChange,
  placeholder,
  allowDecimal = false,
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
        "min-h-[44px] w-full rounded-sm border border-hairline bg-obsidian px-3 py-2 font-mono text-sm tabular-nums text-text-primary placeholder:text-text-muted focus:border-active-border focus:outline-none focus:ring-1 focus:ring-cleared",
        className
      )}
    />
  );
}
