export function AmexLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 780 500"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="American Express"
    >
      <rect width="780" height="500" rx="40" fill="#016fd0" />
      <g fill="#fff">
        <text
          x="390"
          y="220"
          textAnchor="middle"
          fontFamily="Arial, sans-serif"
          fontSize="72"
          fontWeight="bold"
        >
          AMERICAN
        </text>
        <text
          x="390"
          y="310"
          textAnchor="middle"
          fontFamily="Arial, sans-serif"
          fontSize="72"
          fontWeight="bold"
        >
          EXPRESS
        </text>
      </g>
    </svg>
  )
}
