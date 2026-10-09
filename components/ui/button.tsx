import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--brand-pink)] text-white rounded-[var(--radius-md)] shadow-soft hover:bg-[var(--brand-pink-deep)] hover:shadow-soft-md",
        secondary:
          "bg-[var(--brand-blush)] text-[var(--charcoal)] rounded-[var(--radius-md)] hover:bg-[var(--brand-pink-soft)]",
        outline:
          "border border-[var(--border)] bg-white/80 backdrop-blur-sm text-[var(--charcoal)] rounded-[var(--radius-md)] hover:border-[var(--brand-pink-soft)] hover:bg-[var(--brand-blush)]",
        ghost:
          "text-[var(--charcoal)] rounded-[var(--radius-md)] hover:bg-[var(--brand-blush)]",
        link:
          "text-[var(--brand-pink)] underline-offset-4 hover:underline",
        destructive:
          "bg-[var(--error)] text-white rounded-[var(--radius-md)] hover:opacity-90",
        teal:
          "bg-[var(--brand-teal)] text-white rounded-[var(--radius-md)] hover:opacity-90 shadow-soft",
        soft:
          "bg-white text-[var(--charcoal)] rounded-[var(--radius-md)] border border-[var(--border)] shadow-soft hover:shadow-soft-md hover:border-[var(--brand-pink-soft)]",
      },
      size: {
        default: "h-11 px-6 py-2",
        sm: "h-9 rounded-[var(--radius-sm)] px-4 text-xs",
        lg: "h-12 rounded-[var(--radius-lg)] px-8 text-[15px] tracking-wide",
        xl: "h-14 rounded-[var(--radius-lg)] px-10 text-base tracking-wide",
        icon: "h-10 w-10 rounded-[var(--radius-md)]",
        "icon-sm": "h-8 w-8 rounded-[var(--radius-sm)]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
