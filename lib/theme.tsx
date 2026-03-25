'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'

type Theme = 'dark' | 'light'

interface ThemeCtx { theme: Theme; toggleTheme: (e: React.MouseEvent) => void }
const ThemeContext = createContext<ThemeCtx>({ theme: 'dark', toggleTheme: () => {} })

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark')

  useEffect(() => {
    const saved = (localStorage.getItem('ordo-theme') as Theme) ?? 'dark'
    setTheme(saved)
    document.documentElement.setAttribute('data-theme', saved)
  }, [])

  const toggleTheme = useCallback((_e: React.MouseEvent) => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'

    document.documentElement.setAttribute('data-theme', next)
    localStorage.setItem('ordo-theme', next)
    setTheme(next)

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    // Accordion paper-fold: 8 horizontal strips with alternating top/bottom hinges
    // fold away in a staggered wave, each shaded to simulate paper catching and
    // losing light as it rotates in 3D — revealing the new theme underneath.
    const STRIPS = 8
    const h = Math.ceil(window.innerHeight / STRIPS)

    // Strip colors come from the *outgoing* theme
    const bgMid = theme === 'dark' ? '#111111' : '#F2F2F7'
    const bgHi  = theme === 'dark' ? '#1f1f1f' : '#ffffff'
    const bgLo  = theme === 'dark' ? '#060606' : '#e1e1e7'

    const wrap = document.createElement('div')
    Object.assign(wrap.style, {
      position: 'fixed',
      inset: '0',
      zIndex: '99999',
      pointerEvents: 'none',
      perspective: '1200px',
      perspectiveOrigin: '50% 50%',
      overflow: 'hidden',
    })
    document.body.appendChild(wrap)

    let done = 0

    for (let i = 0; i < STRIPS; i++) {
      const topHinge = i % 2 === 0  // alternating hinge direction = accordion Z-fold

      const strip = document.createElement('div')
      Object.assign(strip.style, {
        position: 'absolute',
        left: '0',
        right: '0',
        top: `${i * h}px`,
        height: `${h + 1}px`,  // +1 closes hairline gaps between strips
        // hinge edge is lightest — simulates paper crease catching light
        backgroundImage: topHinge
          ? `linear-gradient(to bottom, ${bgHi} 0%, ${bgMid} 55%, ${bgLo} 100%)`
          : `linear-gradient(to top,   ${bgHi} 0%, ${bgMid} 55%, ${bgLo} 100%)`,
        transformOrigin: topHinge ? 'center top' : 'center bottom',
        willChange: 'transform, filter',
      })
      wrap.appendChild(strip)

      strip.animate(
        [
          // flat, fully lit
          { transform: 'rotateX(0deg)',                                  filter: 'brightness(1)' },
          // mid-fold: face turns away from viewer, darkens
          { transform: topHinge ? 'rotateX(-52deg)' : 'rotateX(52deg)', filter: 'brightness(0.5)',  offset: 0.45 },
          // near-perpendicular: almost edge-on, nearly invisible
          { transform: topHinge ? 'rotateX(-88deg)' : 'rotateX(88deg)', filter: 'brightness(0.07)', offset: 0.88 },
          // fully folded — perpendicular to viewer, completely hidden
          { transform: topHinge ? 'rotateX(-90deg)' : 'rotateX(90deg)', filter: 'brightness(0)' },
        ],
        {
          duration: 390,
          delay: i * 42,
          easing: 'cubic-bezier(0.4, 0, 0.8, 1)',
          fill: 'forwards',
        }
      ).onfinish = () => {
        if (++done === STRIPS) wrap.remove()
      }
    }
  }, [theme])

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>
}

export const useTheme = () => useContext(ThemeContext)
