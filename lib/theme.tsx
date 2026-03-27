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

    // Use the button's centre as the circle origin — more precise than the
    // raw cursor coordinates which vary depending on where inside the button
    // the user clicked.
    const btn  = e.currentTarget as HTMLElement
    const rect = btn.getBoundingClientRect()
    const x    = Math.round(rect.left + rect.width  / 2)
    const y    = Math.round(rect.top  + rect.height / 2)

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.documentElement.setAttribute('data-theme', next)
      localStorage.setItem('ordo-theme', next)
      setTheme(next)
      return
    }

    // New theme's page background colour fills the expanding disc
    const newBg = next === 'dark' ? '#111111' : '#F2F2F7'

    // Radius large enough to reach the farthest viewport corner from the origin
    const radius = Math.hypot(
      Math.max(x, window.innerWidth  - x),
      Math.max(y, window.innerHeight - y),
    ) + 32

    const clip = document.createElement('div')
    Object.assign(clip.style, {
      position:      'fixed',
      inset:         '0',
      zIndex:        '99999',
      background:    newBg,
      clipPath:      `circle(0px at ${x}px ${y}px)`,
      pointerEvents: 'none',
    })
    document.body.appendChild(clip)

    // Force the browser to commit the initial clip-path before we add the
    // transition — without this reflow the browser may merge both style writes
    // into a single paint and skip the animation entirely (the desktop bug).
    void clip.offsetWidth

    // CSS transition is more cross-browser for clip-path than the WAAPI
    // (Safari on macOS had incomplete WAAPI clip-path interpolation support).
    clip.style.transition = 'clip-path 550ms ease-in'
    clip.style.clipPath   = `circle(${radius}px at ${x}px ${y}px)`

    // Switch theme once the disc covers the whole screen so the swap is hidden.
    // The `settled` flag prevents double-firing if both transitionend and the
    // safety-net timeout happen to race.
    let settled = false
    const finish = () => {
      if (settled) return
      settled = true
      clip.removeEventListener('transitionend', finish)
      document.documentElement.setAttribute('data-theme', next)
      localStorage.setItem('ordo-theme', next)
      setTheme(next)
      // Two rAFs: first lets React schedule the repaint, second lets it flush
      requestAnimationFrame(() => requestAnimationFrame(() => clip.remove()))
    }

    clip.addEventListener('transitionend', finish)
    // Safety-net in case transitionend never fires (e.g. tab backgrounded)
    setTimeout(finish, 700)
  }, [theme])

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>
}

export const useTheme = () => useContext(ThemeContext)
