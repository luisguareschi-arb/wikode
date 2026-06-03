import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(var(--background))] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:opacity-90",
        accent:
          "bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] hover:opacity-90",
        destructive: "bg-red-500 text-white hover:bg-red-600",
        outline:
          "border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--app-text))] hover:bg-black/4 dark:hover:bg-white/8",
        secondary:
          "bg-[hsl(var(--app-sidebar))] text-[hsl(var(--app-text))] hover:bg-black/4 dark:hover:bg-white/8",
        ghost:
          "text-[hsl(var(--app-text))] hover:bg-black/4 dark:hover:bg-white/8",
        link: "text-[hsl(var(--accent))] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
