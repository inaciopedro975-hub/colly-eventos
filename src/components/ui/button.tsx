"use client";
import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]",
          {
            "bg-[#d4a017] hover:bg-[#b8860b] text-white shadow-[0_1px_2px_0_rgba(184,134,11,0.3),inset_0_1px_0_0_rgba(255,255,255,0.15)] hover:shadow-[0_2px_4px_0_rgba(184,134,11,0.35),inset_0_1px_0_0_rgba(255,255,255,0.15)]":
              variant === "primary",
            "bg-white hover:bg-[#faf8f3] text-[#2a2419] border border-[#d4cdbe] shadow-[0_1px_2px_0_rgba(42,36,25,0.04)]":
              variant === "secondary",
            "hover:bg-[#f5f1ea] text-[#6b5d47] hover:text-[#2a2419]":
              variant === "ghost",
            "bg-red-50 hover:bg-red-100 text-red-700 border border-red-200":
              variant === "danger",
          },
          {
            "text-xs px-3 py-1.5": size === "sm",
            "text-sm px-4 py-2": size === "md",
            "text-base px-6 py-2.5": size === "lg",
          },
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
export { Button };
