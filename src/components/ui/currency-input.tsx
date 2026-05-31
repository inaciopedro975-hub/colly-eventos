"use client";
import { forwardRef, InputHTMLAttributes, useState } from "react";
import { cn } from "@/lib/utils";

interface CurrencyInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "value" | "type"> {
  label?: string;
  /** valor em string decimal "8980.00" ou number 8980 */
  value: string | number;
  /** devolve sempre string decimal "8980.00" (compatível com APIs já existentes) */
  onChange: (value: string) => void;
  error?: string;
}

/* ─── Helpers exportados (usados também no editor de orçamento) ─── */
export function parseToCents(value: string | number): number {
  if (typeof value === "number") {
    return isNaN(value) ? 0 : Math.round(value * 100);
  }
  if (!value || value === "") return 0;
  const str = value.toString().trim();
  let normalized: string;
  if (str.includes(",")) {
    normalized = str.replace(/\./g, "").replace(",", ".");
  } else {
    normalized = str;
  }
  const num = parseFloat(normalized);
  return isNaN(num) ? 0 : Math.round(num * 100);
}

export function formatBRL(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/* ─── Conversões internas ─── */
// valor decimal → texto editável natural ("2500" ou "2500,50")
function toEditable(value: string | number): string {
  if (value === "" || value === null || value === undefined) return "";
  const cents = parseToCents(value);
  if (cents === 0 && (value === "" || value === "0" || value === "0.00")) return "";
  const reais = Math.floor(cents / 100);
  const c = cents % 100;
  return c === 0 ? String(reais) : `${reais},${String(c).padStart(2, "0")}`;
}

// valor decimal → exibição formatada ("2.500,00")
function toDisplay(value: string | number): string {
  if (value === "" || value === null || value === undefined) return "";
  return formatBRL(parseToCents(value));
}

// texto digitado → string decimal "2500.00"
function editableToDecimal(text: string): string {
  if (!text) return "";
  const parts = text.split(",");
  const reais = parts[0].replace(/\D/g, "") || "0";
  let cents = (parts[1] ?? "").replace(/\D/g, "").slice(0, 2);
  cents = cents.padEnd(2, "0");
  return `${reais}.${cents}`;
}

const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ label, value, onChange, error, className, placeholder, ...props }, ref) => {
    const [focused, setFocused] = useState(false);
    const [text, setText] = useState("");

    // Enquanto editando: mostra o que o usuário digita (sem pontos de milhar).
    // Fora de foco: mostra formatado bonito "2.500,00".
    const display = focused ? text : toDisplay(value);

    function handleFocus(e: React.FocusEvent<HTMLInputElement>) {
      setText(toEditable(value));
      setFocused(true);
      props.onFocus?.(e);
    }

    function handleBlur(e: React.FocusEvent<HTMLInputElement>) {
      setFocused(false);
      props.onBlur?.(e);
    }

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
      let raw = e.target.value.replace(/[^\d,]/g, "");
      const idx = raw.indexOf(",");
      if (idx !== -1) {
        const intp = raw.slice(0, idx).replace(/\D/g, "");
        const dec = raw.slice(idx + 1).replace(/\D/g, "").slice(0, 2);
        raw = intp + "," + dec;
      }
      setText(raw);
      onChange(editableToDecimal(raw));
    }

    return (
      <div className="flex flex-col gap-1">
        {label && <label className="text-sm font-medium text-[#6b5d47]">{label}</label>}
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9b8b73] text-sm pointer-events-none select-none">
            R$
          </span>
          <input
            ref={ref}
            type="text"
            inputMode="decimal"
            value={display}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={placeholder ?? "0,00"}
            className={cn(
              "w-full pl-9 pr-3 py-2 rounded-lg bg-white border border-[#d4cdbe] text-[#2a2419] text-sm tabular text-right focus:outline-none focus:border-[#b8860b]",
              error && "border-red-300 focus:border-red-400",
              className
            )}
            {...props}
          />
        </div>
        {error && <span className="text-xs text-red-600 mt-0.5">{error}</span>}
      </div>
    );
  }
);

CurrencyInput.displayName = "CurrencyInput";
export { CurrencyInput };
