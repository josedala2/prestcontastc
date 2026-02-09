import { cn } from "@/lib/utils";

interface BrasaoAngolaProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

/**
 * Emblema estilizado da República de Angola
 * Inspirado no brasão oficial: machete, enxada, roda dentada, estrela, livro aberto
 */
export function BrasaoAngola({ className, size = "md" }: BrasaoAngolaProps) {
  const sizeMap = {
    sm: "w-7 h-7",
    md: "w-9 h-9",
    lg: "w-14 h-14",
  };

  return (
    <svg
      viewBox="0 0 100 100"
      className={cn(sizeMap[size], className)}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer gold circle — gear/roda dentada */}
      <circle cx="50" cy="50" r="46" fill="none" stroke="#C8A951" strokeWidth="3" />
      {/* Gear teeth */}
      {Array.from({ length: 16 }).map((_, i) => {
        const angle = (i * 360) / 16;
        const rad = (angle * Math.PI) / 180;
        const x1 = 50 + 44 * Math.cos(rad);
        const y1 = 50 + 44 * Math.sin(rad);
        const x2 = 50 + 49 * Math.cos(rad);
        const y2 = 50 + 49 * Math.sin(rad);
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="#C8A951"
            strokeWidth="4"
            strokeLinecap="round"
          />
        );
      })}
      {/* Inner red circle */}
      <circle cx="50" cy="50" r="38" fill="#CC092F" />
      {/* Black inner circle */}
      <circle cx="50" cy="50" r="34" fill="#1A1A1A" />

      {/* Star */}
      <polygon
        points="50,18 53,28 63,28 55,34 58,44 50,38 42,44 45,34 37,28 47,28"
        fill="#C8A951"
      />

      {/* Machete (left) */}
      <line x1="30" y1="70" x2="42" y2="40" stroke="#C8A951" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M42,40 Q44,36 40,34" stroke="#C8A951" strokeWidth="2" fill="none" />

      {/* Enxada/hoe (right) */}
      <line x1="70" y1="70" x2="58" y2="40" stroke="#C8A951" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M58,40 Q56,36 60,34" stroke="#C8A951" strokeWidth="2" fill="none" />

      {/* Open book */}
      <path
        d="M38,58 Q44,54 50,58 Q56,54 62,58 L62,68 Q56,64 50,68 Q44,64 38,68 Z"
        fill="#C8A951"
        opacity="0.9"
      />
      <line x1="50" y1="58" x2="50" y2="68" stroke="#1A1A1A" strokeWidth="0.8" />

      {/* Sunrise rays at bottom */}
      {[-20, -10, 0, 10, 20].map((angle, i) => {
        const rad = ((angle - 90) * Math.PI) / 180;
        const x1 = 50 + 20 * Math.cos(rad);
        const y1 = 75 + 20 * Math.sin(rad);
        const x2 = 50 + 28 * Math.cos(rad);
        const y2 = 75 + 28 * Math.sin(rad);
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="#C8A951"
            strokeWidth="1.5"
            opacity="0.7"
          />
        );
      })}
    </svg>
  );
}
