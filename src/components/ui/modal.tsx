"use client";
import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
  closeOnBackdropClick?: boolean;
}

export function Modal({ open, onClose, title, children, className, closeOnBackdropClick = true }: ModalProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-[#2a2419]/40 backdrop-blur-sm"
        onClick={closeOnBackdropClick ? onClose : undefined}
      />
      <div
        ref={ref}
        className={cn(
          "relative w-full max-w-lg bg-white border border-[#ede7dc] rounded-xl max-h-[90vh] overflow-y-auto",
          className
        )}
        style={{ boxShadow: "0 24px 48px -12px rgba(42, 36, 25, 0.25), 0 8px 16px -8px rgba(42, 36, 25, 0.12)" }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#f5f1ea]">
          <h2 className="text-base font-semibold text-[#2a2419]">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#9b8b73] hover:text-[#2a2419] hover:bg-[#f5f1ea] transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}
