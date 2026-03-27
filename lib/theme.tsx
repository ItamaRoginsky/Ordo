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

  const toggleTheme = useCallback((e: React.MouseEvent) => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'

    // Origin of the expanding circle — use the click coordinates
    const x = e.clientX
    const y = e.clientY

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.documentElement.setAttribute('data-theme', next)
      localStorage.setItem('ordo-theme', next)
      setTheme(next)
      return
    }

    // The new theme's page background fills the expanding circle
    const newBg = next === 'dark' ? '#111111' : '#F2F2F7'

    // Radius just large enough to cover every corner of the viewport from (x, y)
    const radius = Math.hypot(
      Math.max(x, window.innerWidth  - x),
      Math.max(y, window.innerHeight - y),
    ) + 32 // small buffer so the edge is never visible

    const clip = document.createElement('div')
    Object.assign(clip.style, {
      position:   'fixed',
      inset:      '0',
      zIndex:     '99999',
      background: newBg,
      clipPath:   `circle(0px at ${x}px ${y}px)`,
      pointerEvents: 'none',
      willChange: 'clip-path',
    })
    document.body.appendChild(clip)

    clip.animate(
      [
        { clipPath: `circle(0px at ${x}px ${y}px)` },
        { clipPath: `circle(${radius}px at ${x}px ${y}px)` },
      ],
      { duration: 550, easing: 'ease-in', fill: 'forwards' },
    ).onfinish = () => {
      // Switch the theme while the clip is covering the whole screen — no flash
      document.documentElement.setAttribute('data-theme', next)
      localStorage.setItem('ordo-theme', next)
      setTheme(next)
      // Two rAFs: first lets React schedule the paint, second lets it finish
      requestAnimationFrame(() => requestAnimationFrame(() => clip.remove()))
    }
  }, [theme])

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>
}

export const useTheme = () => useContext(ThemeContext)
