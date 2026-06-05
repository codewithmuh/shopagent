/**
 * ShopAgent brand mark — a shopping bag fused with a chat "typing" indicator
 * ("commerce through conversation") on the emerald → teal brand gradient.
 *
 * Single source of truth for the in-app logo. Mirrors /public/favicon.svg.
 */
export function LogoMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      role="img"
      aria-label="ShopAgent"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="sa-logo" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#10b981" />
          <stop offset="1" stopColor="#0d9488" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="7" fill="url(#sa-logo)" />
      {/* shopping bag handle */}
      <path
        d="M12.5 14.5v-1.3a3.5 3.5 0 0 1 7 0v1.3"
        fill="none"
        stroke="#ffffff"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      {/* shopping bag body */}
      <path d="M11.5 14.3H20.5L22 22.8a2.2 2.2 0 0 1-2.2 2.4H12.2a2.2 2.2 0 0 1-2.2-2.4Z" fill="#ffffff" />
      {/* chat / conversation dots */}
      <g fill="#0d9488">
        <circle cx="13.7" cy="19.8" r="1" />
        <circle cx="16" cy="19.8" r="1" />
        <circle cx="18.3" cy="19.8" r="1" />
      </g>
    </svg>
  );
}

/** Mark + "ShopAgent" wordmark lockup. */
export function Logo({
  markClassName = "h-8 w-8",
  textClassName = "text-xl font-bold tracking-tight",
}: {
  markClassName?: string;
  textClassName?: string;
}) {
  return (
    <span className="inline-flex items-center gap-2">
      <LogoMark className={markClassName} />
      <span className={textClassName}>ShopAgent</span>
    </span>
  );
}
