import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold tracking-wider uppercase transition-colors",
  {
    variants: {
      variant: {
        default: "bg-[var(--brand-pink)] text-white shadow-soft",
        secondary: "bg-[var(--brand-blush)] text-[var(--brand-pink-deep)]",
        sale: "bg-[var(--error)] text-white shadow-soft",
        new: "bg-[var(--brand-teal)] text-white shadow-soft",
        outline: "border border-[var(--border)] bg-white/90 text-[var(--muted)] backdrop-blur-sm",
        gold: "bg-[var(--brand-gold-soft)] text-[#8B6914]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
