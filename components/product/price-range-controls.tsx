"use client";

import { useState } from "react";

type PriceRangeControlsProps = {
  minPrice?: number;
  maxPrice?: number;
  ceiling: number;
};

function formatPrice(value: number) {
  return `Rs. ${value.toLocaleString("en-PK")}`;
}

export function PriceRangeControls({
  minPrice,
  maxPrice,
  ceiling,
}: PriceRangeControlsProps) {
  const safeCeiling = Math.max(1, Math.ceil(ceiling));
  const [minimum, setMinimum] = useState(Math.min(minPrice ?? 0, safeCeiling));
  const [maximum, setMaximum] = useState(Math.min(maxPrice ?? safeCeiling, safeCeiling));

  function updateMinimum(value: number) {
    const next = Math.max(0, Math.min(value, maximum, safeCeiling));
    setMinimum(next);
  }

  function updateMaximum(value: number) {
    const next = Math.max(minimum, Math.min(value, safeCeiling));
    setMaximum(next);
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="mb-1.5 block text-xs text-[var(--muted)]">Minimum</span>
          <input
            type="number"
            name="minPrice"
            min="0"
            max={maximum}
            step="1"
            inputMode="numeric"
            value={minimum || ""}
            onChange={(event) => updateMinimum(Number(event.target.value) || 0)}
            placeholder="Any"
            className="h-10 w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-white px-3 text-sm focus:border-[var(--brand-pink)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-pink)]/20"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs text-[var(--muted)]">Maximum</span>
          <input
            type="number"
            name="maxPrice"
            min={minimum}
            max={safeCeiling}
            step="1"
            inputMode="numeric"
            value={maximum === safeCeiling ? "" : maximum}
            onChange={(event) => updateMaximum(Number(event.target.value) || 0)}
            placeholder="Any"
            className="h-10 w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-white px-3 text-sm focus:border-[var(--brand-pink)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-pink)]/20"
          />
        </label>
      </div>

      <div className="space-y-4 rounded-xl bg-[#fff8fb] px-3.5 py-4">
        <label className="block">
          <span className="mb-2 flex items-center justify-between text-xs">
            <span className="font-medium text-[var(--charcoal)]">Minimum price</span>
            <span className="tabular-nums text-[var(--muted)]">{formatPrice(minimum)}</span>
          </span>
          <input
            type="range"
            aria-label="Minimum price slider"
            min="0"
            max={safeCeiling}
            step="1"
            value={minimum}
            onChange={(event) => updateMinimum(Number(event.target.value))}
            className="h-2 w-full cursor-pointer accent-[#e91e8c]"
          />
        </label>
        <label className="block">
          <span className="mb-2 flex items-center justify-between text-xs">
            <span className="font-medium text-[var(--charcoal)]">Maximum price</span>
            <span className="tabular-nums text-[var(--muted)]">{formatPrice(maximum)}</span>
          </span>
          <input
            type="range"
            aria-label="Maximum price slider"
            min="0"
            max={safeCeiling}
            step="1"
            value={maximum}
            onChange={(event) => updateMaximum(Number(event.target.value))}
            className="h-2 w-full cursor-pointer accent-[#e91e8c]"
          />
        </label>
      </div>
      <p className="text-[11px] leading-4 text-[var(--muted)]">
        Available range: {formatPrice(0)} – {formatPrice(safeCeiling)}
      </p>
    </div>
  );
}
