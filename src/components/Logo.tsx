import { useState } from "react";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  variant?: "light" | "dark";
  maxHeight?: number;
}

/**
 * Gerson Gomes — Advocacia e Consultoria Jurídica.
 * Logo PNG transparente com monograma GG em dourado.
 * Possui fallback vetorial (SVG) elegante se o asset remoto não puder ser carregado (offline).
 */
export function Logo({ className, variant = "light", maxHeight = 80 }: LogoProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    const isDarkVariant = variant === "dark";
    return (
      <div
        style={{ height: maxHeight }}
        className={cn("flex flex-col items-center justify-center select-none font-serif", className)}
      >
        {/* Monograma GG em círculo dourado */}
        <div 
          className={cn(
            "flex items-center justify-center rounded-full border border-amber-accent/40 bg-gradient-to-br from-neutral-900 to-black text-amber-accent font-bold shadow-md",
            maxHeight < 50 ? "w-8 h-8 text-xs" : "w-12 h-12 text-sm"
          )}
        >
          GG
        </div>
        {maxHeight >= 50 && (
          <div className="mt-2 text-center">
            <h2 
              className={cn(
                "text-xs font-semibold tracking-wider uppercase",
                isDarkVariant ? "text-sidebar-foreground" : "text-foreground"
              )}
            >
              Gerson Gomes
            </h2>
            <p className="text-[7px] text-muted-foreground uppercase tracking-[0.2em] font-sans mt-0.5">
              Advocacia & Consultoria
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <img
      src="./gersonlogo.png"
      alt="Gerson Gomes — Advocacia e Consultoria Jurídica"
      style={{ maxHeight }}
      className={cn("w-auto object-contain select-none", className)}
      draggable={false}
      onError={() => setHasError(true)}
    />
  );
}
