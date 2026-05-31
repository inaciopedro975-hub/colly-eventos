import { cn } from "@/lib/utils";
import { SelectHTMLAttributes, forwardRef } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, children, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label className="text-sm font-medium text-[#6b5d47]">{label}</label>
        )}
        <select
          ref={ref}
          className={cn(
            "w-full px-3 py-2 rounded-lg bg-white border border-[#d4cdbe] text-[#2a2419] text-sm transition-colors cursor-pointer",
            "focus:outline-none focus:border-[#b8860b] focus:ring-2 focus:ring-[#d4a017]/15",
            error && "border-red-300",
            className
          )}
          {...props}
        >
          {children}
        </select>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    );
  }
);

Select.displayName = "Select";
export { Select };
