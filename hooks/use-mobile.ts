/**
 * @fileoverview Hook for detecting mobile viewport size.
 * Uses matchMedia API to detect screen width below 768px.
 */

import * as React from 'react'

/**
 * Breakpoint width in pixels for mobile detection.
 * Screens below this width are considered mobile.
 * 
 * @constant {number}
 */
const MOBILE_BREAKPOINT = 768

/**
 * React hook to detect if the current viewport is mobile-sized.
 * Uses window.matchMedia to listen for viewport changes.
 * Returns undefined during SSR, then boolean after hydration.
 * 
 * @returns {boolean} True if viewport width is less than 768px, false otherwise
 * 
 * @example
 * ```tsx
 * function ResponsiveComponent() {
 *   const isMobile = useIsMobile();
 *   
 *   return (
 *     <div>
 *       {isMobile ? <MobileView /> : <DesktopView />}
 *     </div>
 *   );
 * }
 * ```
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener('change', onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener('change', onChange)
  }, [])

  return !!isMobile
}
