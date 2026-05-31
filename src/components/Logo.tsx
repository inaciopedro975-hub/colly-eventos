import { cn } from "@/lib/utils";

interface LogoProps {
  size?: number;
  variant?: "dark" | "light" | "amber";
  className?: string;
}

export function Logo({ size = 40, variant = "dark", className }: LogoProps) {
  // Logo PNG é preta sobre fundo transparente.
  // Em fundos brancos (variant="light"): exibir como está — preto visível.
  // Em fundos escuros ou âmbar (variant="dark"/"amber"): inverter para branco.
  const needsInvert = variant === "dark" || variant === "amber";

  return (
    <div className={cn("inline-flex items-center flex-shrink-0", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo.png"
        alt="Colly Eventos"
        width={size}
        height={size}
        style={{
          objectFit: "contain",
          filter: needsInvert ? "invert(1) brightness(2)" : "none",
        }}
      />
    </div>
  );
}
