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
    const x = e.clientX, y = e.clientY
    const next: Theme = theme === 'dark' ? 'light' : 'dark'

    document.documentElement.setAttribute('data-theme', next)
    localStorage.setItem('ordo-theme', next)
    setTheme(next)

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const overlay = document.createElement('div')
    Object.assign(overlay.style, {
      position: 'fixed', inset: '0', zIndex: '99999',
      background: next === 'light' ? '#F2F2F7' : '#111111',
      clipPath: `circle(0% at ${x}px ${y}px)`,
      pointerEvents: 'none', willChange: 'clip-path',
    })
    document.body.appendChild(overlay)

    const anim = overlay.animate([
      { clipPath: `circle(0% at ${x}px ${y}px)` },
      { clipPath: `circle(150% at ${x}px ${y}px)` },
    ], { duration: 480, easing: 'cubic-bezier(0.4, 0, 0.2, 1)', fill: 'forwards' })

    anim.onfinish = () => overlay.remove()
  }, [theme])

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>
}

export const useTheme = () => useContext(ThemeContext)
