import { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-10 w-full rounded-control border border-border bg-surface px-3 text-sm outline-none focus:border-primary",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";
