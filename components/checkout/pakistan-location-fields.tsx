"use client";

import { useId, useMemo, useState, type KeyboardEvent } from "react";
import { ChevronDown, MapPin } from "lucide-react";
import { PAKISTAN_CITIES, PAKISTAN_REGIONS, type PakistanRegion } from "@/lib/locations/pakistan";

const fieldClassName =
  "h-11 w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-white px-3 text-sm outline-none transition focus:border-[var(--brand-pink)] focus:ring-2 focus:ring-[var(--brand-pink)]/20";

export function PakistanLocationFields() {
  const listboxId = useId();
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [hasAutoSelectedProvince, setHasAutoSelectedProvince] = useState(false);
  const [isCityListOpen, setIsCityListOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const cityOptions = useMemo(() => {
    const query = city.trim().toLocaleLowerCase();
    if (!query) return [];
    return PAKISTAN_CITIES
      .filter(({ name, region }) =>
        name.toLocaleLowerCase().includes(query) &&
        (!province || region === province)
      )
      .sort((a, b) => {
        const aStartsWithQuery = a.name.toLocaleLowerCase().startsWith(query);
        const bStartsWithQuery = b.name.toLocaleLowerCase().startsWith(query);
        if (aStartsWithQuery !== bStartsWithQuery) return aStartsWithQuery ? -1 : 1;
        return a.name.localeCompare(b.name);
      })
      .slice(0, 8);
  }, [city, province]);

  function selectCity(name: string, region: PakistanRegion) {
    setCity(name);
    setProvince(region);
    setHasAutoSelectedProvince(true);
    setIsCityListOpen(false);
    setActiveIndex(-1);
  }

  function handleCityKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown" && cityOptions.length > 0) {
      event.preventDefault();
      setIsCityListOpen(true);
      setActiveIndex((index) => (index + 1) % cityOptions.length);
    } else if (event.key === "ArrowUp" && cityOptions.length > 0) {
      event.preventDefault();
      setIsCityListOpen(true);
      setActiveIndex((index) => (index <= 0 ? cityOptions.length - 1 : index - 1));
    } else if (event.key === "Enter" && isCityListOpen && activeIndex >= 0) {
      event.preventDefault();
      const option = cityOptions[activeIndex];
      if (option) selectCity(option.name, option.region);
    } else if (event.key === "Escape") {
      setIsCityListOpen(false);
      setActiveIndex(-1);
    }
  }

  return (
    <div className="grid gap-4 sm:col-span-2 sm:grid-cols-2">
      <div className="relative">
        <label className="mb-1.5 block text-sm font-medium" htmlFor="shippingCity">
          City <span aria-hidden="true" className="text-[var(--error)]">*</span>
        </label>
        <div className="relative">
          <input
            id="shippingCity"
            name="shippingCity"
            type="text"
            required
            autoComplete="address-level2"
            value={city}
            onChange={(event) => {
              setCity(event.target.value);
              if (hasAutoSelectedProvince) setProvince("");
              setHasAutoSelectedProvince(false);
              setIsCityListOpen(true);
              setActiveIndex(-1);
            }}
            onFocus={() => {
              if (city.trim()) setIsCityListOpen(true);
            }}
            onBlur={() => {
              window.setTimeout(() => setIsCityListOpen(false), 120);
            }}
            onKeyDown={handleCityKeyDown}
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={isCityListOpen && cityOptions.length > 0}
            aria-controls={listboxId}
            aria-activedescendant={
              activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined
            }
            placeholder="Start typing a city"
            className={`${fieldClassName} pr-10`}
          />
          <MapPin
            size={16}
            aria-hidden="true"
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)]"
          />
        </div>
        {isCityListOpen && cityOptions.length > 0 && (
          <ul
            id={listboxId}
            role="listbox"
            aria-label="Pakistani cities"
            className="absolute z-30 mt-1 max-h-64 w-full overflow-y-auto rounded-[var(--radius-md)] border border-[var(--border)] bg-white p-1.5 shadow-lg"
          >
            {cityOptions.map((option, index) => (
              <li
                key={`${option.name}-${option.region}`}
                id={`${listboxId}-option-${index}`}
                role="option"
                aria-selected={activeIndex === index}
              >
                <button
                  type="button"
                  tabIndex={-1}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => selectCity(option.name, option.region)}
                  className={`flex w-full items-center justify-between rounded px-3 py-2.5 text-left text-sm ${
                    activeIndex === index
                      ? "bg-[var(--brand-blush)] text-[var(--brand-pink)]"
                      : "text-[var(--charcoal)] hover:bg-[var(--brand-blush)]"
                  }`}
                >
                  <span>{option.name}</span>
                  <span className="ml-3 text-xs text-[var(--muted)]">{option.region}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {city.trim().length > 0 && cityOptions.length === 0 && (
          <p className="mt-1 text-xs text-[var(--muted)]">
            No city suggestions. You can enter your city and choose its province.
          </p>
        )}
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium" htmlFor="shippingProvince">
          Province / region <span aria-hidden="true" className="text-[var(--error)]">*</span>
        </label>
        <div className="relative">
          <select
            id="shippingProvince"
            name="shippingProvince"
            required
            autoComplete="address-level1"
            value={province}
            onChange={(event) => {
              setProvince(event.target.value);
              setHasAutoSelectedProvince(false);
            }}
            className={`${fieldClassName} appearance-none pr-10`}
          >
            <option value="" disabled>
              Select province or region
            </option>
            {PAKISTAN_REGIONS.map((region) => (
              <option key={region} value={region}>
                {region}
              </option>
            ))}
          </select>
          <ChevronDown
            size={16}
            aria-hidden="true"
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)]"
          />
        </div>
      </div>
    </div>
  );
}
