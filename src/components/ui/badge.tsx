import { cn } from "@/lib/utils";

type BadgeVariant = "confirmado" | "tentativo" | "cancelado" | "rascunho" | "enviado" | "aprovado" | "rejeitado" | "default";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  confirmado: "bg-emerald-50 text-emerald-700 border-emerald-200",
  tentativo: "bg-amber-50 text-amber-700 border-amber-200",
  cancelado: "bg-red-50 text-red-700 border-red-200",
  rascunho: "bg-[#f5f1ea] text-[#6b5d47] border-[#d4cdbe]",
  enviado: "bg-blue-50 text-blue-700 border-blue-200",
  aprovado: "bg-emerald-50 text-emerald-700 border-emerald-200",
  rejeitado: "bg-red-50 text-red-700 border-red-200",
  default: "bg-[#f5f1ea] text-[#6b5d47] border-[#d4cdbe]",
};

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border",
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
