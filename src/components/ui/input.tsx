import { cn } from "@/lib/utils";
import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label className="text-sm font-medium text-[#6b5d47]">{label}</label>
        )}
        <input
          ref={ref}
          className={cn(
            "w-full px-3 py-2 rounded-lg bg-white border border-[#d4cdbe] text-[#2a2419] placeholder-[#9b8b73]",
            "text-base lg:text-sm transition-colors",
            "focus:outline-none focus:border-[#b8860b] focus:ring-2 focus:ring-[#d4a017]/15",
            error && "border-red-300 focus:border-red-400",
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
export { Input };
