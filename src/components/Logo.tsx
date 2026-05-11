interface LogoProps {
  size?: number;
  className?: string;
  glyphOnly?: boolean;
}

export function Logo({ size = 40, className, glyphOnly = false }: LogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 96 96"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label="Project AB"
    >
      <defs>
        <linearGradient id="ab-stroke" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FFB546" />
          <stop offset="100%" stopColor="#E0A85A" />
        </linearGradient>
      </defs>
      {!glyphOnly && (
        <rect x="2" y="2" width="92" height="92" rx="22" fill="#141416" stroke="#26262B" strokeWidth="2" />
      )}
      {/* A — left triangle */}
      <path
        d="M22 70 L36 26 L50 70 M27.5 56 L44.5 56"
        fill="none"
        stroke="url(#ab-stroke)"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* B — right rounded letter */}
      <path
        d="M58 26 L58 70 L70 70 C77 70 81.5 65.5 81.5 60 C81.5 55 78 51 73 51 L58 51 M58 51 L72 51 C77 51 80 47 80 42 C80 37 76 33 71 33 L58 33 Z"
        fill="none"
        stroke="url(#ab-stroke)"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
