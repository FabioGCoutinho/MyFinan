export function HipercardLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 780 500"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Hipercard"
    >
      <rect width="780" height="500" rx="40" fill="#822124" />
      <g>
        <circle cx="390" cy="210" r="50" fill="#f4a127" />
        <text
          x="390"
          y="340"
          textAnchor="middle"
          fill="#fff"
          fontFamily="Arial, sans-serif"
          fontSize="80"
          fontWeight="bold"
        >
          HIPERCARD
        </text>
      </g>
    </svg>
  )
}
