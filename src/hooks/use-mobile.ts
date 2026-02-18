'use client'

import { useEffect, useState } from 'react'

/**
 * Hook centralizado para detectar breakpoint mobile.
 * Usa `matchMedia` ao invés de `resize` para disparar
 * apenas quando o breakpoint é cruzado (muito mais eficiente).
 */
export function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${breakpoint - 1}px)`)
    setIsMobile(mql.matches)

    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [breakpoint])

  return isMobile
}
