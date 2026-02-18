export function EloLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 780 500"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Elo"
    >
      <g>
        <path
          d="M235.59 200.65c-11.47-4.18-23.87-6.47-36.8-6.47-55.07 0-100.18 41.2-106.6 94.48l50.89 13.12c3.36-27.45 27.01-48.73 55.71-48.73 6.93 0 13.55 1.24 19.67 3.49l17.13-55.89z"
          fill="#00a4e0"
        />
        <path
          d="M143.08 329.45l-50.89 13.12c11.83 47.79 54.63 83.25 105.61 84.72l.99-53.04c-26.21-.72-48.46-19.59-55.71-44.8z"
          fill="#ffcb05"
        />
        <path
          d="M250.79 374.25l-.99-53.04c-5.32 3.18-11.51 5.02-18.11 5.02-19.13 0-34.82-14.78-36.22-33.49l-50.89 13.12c4.36 43.72 37.51 78.31 79.08 82.32 9.41.91 18.53.28 27.13-1.83v-12.1z"
          fill="#ef4123"
        />
        <circle cx="198.79" cy="290.75" r="36.65" fill="none" />
        <text
          x="340"
          y="310"
          fill="#231f20"
          fontFamily="Arial, sans-serif"
          fontSize="180"
          fontWeight="bold"
        >
          elo
        </text>
      </g>
    </svg>
  )
}
