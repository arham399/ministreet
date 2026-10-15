import Link from "next/link";

export type ColorOptionLink = {
  id: string;
  slug: string;
  name: string | null;
  hex: string | null;
  stockQuantity: number;
};

export function ColorVariantSelector({
  options,
  selectedProductId,
}: {
  options: ColorOptionLink[];
  selectedProductId: string;
}) {
  if (options.length < 2) return null;
  const selected = options.find((option) => option.id === selectedProductId);

  return (
    <fieldset className="mb-5">
      <legend className="mb-2 text-sm font-medium text-[var(--charcoal)]">
        Color <span className="font-normal text-[var(--muted)]">· {selected?.name || "Choose a color"}</span>
      </legend>
      <div className="flex flex-wrap gap-2.5">
        {options.map((option) => {
          const isSelected = option.id === selectedProductId;
          return (
            <Link
              key={option.id}
              href={`/product/${option.slug}`}
              title={`${option.name || "Color"}${option.stockQuantity <= 0 ? " · Sold out" : ""}`}
              aria-label={`Choose ${option.name || "color"}${option.stockQuantity <= 0 ? ", sold out" : ""}`}
              aria-current={isSelected ? "page" : undefined}
              className={`group relative flex h-10 items-center gap-2 rounded-full border px-2.5 text-xs transition-colors ${
                isSelected
                  ? "border-[var(--brand-pink)] bg-white ring-1 ring-[var(--brand-pink)]"
                  : "border-[var(--border)] bg-white hover:border-[var(--brand-pink-soft)]"
              } ${option.stockQuantity <= 0 ? "opacity-55" : ""}`}
            >
              <span
                className="size-5 rounded-full border border-black/10 shadow-inner"
                style={{ backgroundColor: option.hex || "#d4af37" }}
                aria-hidden="true"
              />
              <span className="pr-1">{option.name || "Color"}</span>
              {option.stockQuantity <= 0 && <span className="sr-only">Sold out</span>}
            </Link>
          );
        })}
      </div>
    </fieldset>
  );
}
