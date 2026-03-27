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

    // Button centre in viewport coordinates — the circle expands from here
    const btn  = e.currentTarget as HTMLElement
    const rect = btn.getBoundingClientRect()
    const x    = rect.left + rect.width  / 2
    const y    = rect.top  + rect.height / 2

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.documentElement.setAttribute('data-theme', next)
      localStorage.setItem('ordo-theme', next)
      setTheme(next)
      return
    }

    const newBg  = next === 'dark' ? '#111111' : '#F2F2F7'
    const radius = Math.hypot(
      Math.max(x, window.innerWidth  - x),
      Math.max(y, window.innerHeight - y),
    ) + 32

    // Inject a named @keyframes rule with the exact origin baked in.
    // A CSS *animation* fires as soon as the element is in the DOM and cannot
    // be silently coalesced away by the browser the way a CSS *transition* can
    // when both start and end values are written in the same JS task — which
    // is what caused the animation to never play on Chrome/Windows.
    const id      = `ordo-reveal-${Date.now()}`
    const styleEl = document.createElement('style')
    styleEl.textContent =
      `@keyframes ${id}{` +
        `from{clip-path:circle(0px at ${x}px ${y}px)}` +
        `to{clip-path:circle(${radius}px at ${x}px ${y}px)}` +
      `}`
    document.head.appendChild(styleEl)

    const clip = document.createElement('div')
    Object.assign(clip.style, {
      position:      'fixed',
      inset:         '0',
      zIndex:        '99999',
      background:    newBg,
      pointerEvents: 'none',
      animation:     `${id} 550ms ease-in forwards`,
    })
    document.body.appendChild(clip)

    // Commit the theme change once the disc covers the screen, then clean up.
    // `settled` prevents the animationend listener and the safety-net timeout
    // from both firing.
    let settled = false
    const commit = () => {
      if (settled) return
      settled = true
      clip.removeEventListener('animationend', commit)
      document.documentElement.setAttribute('data-theme', next)
      localStorage.setItem('ordo-theme', next)
      setTheme(next)
      // Two rAFs so React's repaint is flushed before we pull the overlay away
      requestAnimationFrame(() => requestAnimationFrame(() => {
        clip.remove()
        styleEl.remove()
      }))
    }

    clip.addEventListener('animationend', commit)
    setTimeout(commit, 700) // safety-net (tab hidden, slow device, etc.)
  }, [theme])

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>
}

export const useTheme = () => useContext(ThemeContext)
