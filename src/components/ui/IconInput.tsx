import { InputHTMLAttributes, ReactNode, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface IconInputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon: ReactNode;
}

/** Input com um ícone fixo à esquerda — usado nas telas de autenticação. */
export const IconInput = forwardRef<HTMLInputElement, IconInputProps>(
  ({ className, icon, ...props }, ref) => (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary">
        {icon}
      </span>
      <input
        ref={ref}
        className={cn(
          "h-11 w-full rounded-control border border-border bg-surface pl-9 pr-3 text-sm outline-none transition-colors focus:border-primary",
          className
        )}
        {...props}
      />
    </div>
  )
);
IconInput.displayName = "IconInput";
