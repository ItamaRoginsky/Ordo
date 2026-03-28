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

    // Button centre — the growing circle is anchored here
    const btn     = e.currentTarget as HTMLElement
    const rect    = btn.getBoundingClientRect()
    const originX = rect.left + rect.width  / 2
    const originY = rect.top  + rect.height / 2

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.documentElement.setAttribute('data-theme', next)
      localStorage.setItem('ordo-theme', next)
      setTheme(next)
      return
    }

    // Place a zero-size div exactly at the button centre.
    // The CSS @keyframes (theme-circle-open in globals.css) grows it to
    // 500vmax × 500vmax while applying margin: -250vmax so the circle centre
    // stays pinned to the button throughout — the CodePen vmax trick.
    const clip = document.createElement('div')
    clip.className = 'theme-clip'
    Object.assign(clip.style, {
      top:        `${originY}px`,
      left:       `${originX}px`,
      background: next === 'dark' ? '#111111' : '#F2F2F7',
    })
    document.body.appendChild(clip)

    // Reading a layout property forces the browser to commit the element's
    // initial (0 × 0) state before the animation class is applied.
    void clip.getBoundingClientRect()

    // Adding the class starts the CSS animation — no JS timing required.
    clip.classList.add('animating')

    // Once the disc covers the whole screen, swap the real theme (the clip is
    // hiding everything so there is no visible flash), then remove it.
    let settled = false
    const commit = () => {
      if (settled) return
      settled = true
      clip.removeEventListener('animationend', commit)
      document.documentElement.setAttribute('data-theme', next)
      localStorage.setItem('ordo-theme', next)
      setTheme(next)
      // Two rAFs let React flush its repaint before the overlay is pulled away
      requestAnimationFrame(() => requestAnimationFrame(() => clip.remove()))
    }

    clip.addEventListener('animationend', commit)
    setTimeout(commit, 800) // safety-net: fires if animationend never arrives
  }, [theme])

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>
}

export const useTheme = () => useContext(ThemeContext)
