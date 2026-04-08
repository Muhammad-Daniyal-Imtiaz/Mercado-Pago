"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

type Theme = 'light' | 'dark' | 'system'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  resolvedTheme: 'light' | 'dark'
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'system'
  return (localStorage.getItem('theme') as Theme) || 'system'
}

function getInitialResolvedTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light'
  const theme = getInitialTheme()
  if (theme === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return theme
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme)
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(getInitialResolvedTheme)

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
    setResolvedTheme(newTheme === 'system' ? getSystemTheme() : newTheme)
    localStorage.setItem('theme', newTheme)
  }

  // Apply theme changes only when user explicitly changes it
  useEffect(() => {
    const resolved = theme === 'system' ? getSystemTheme() : theme
    setResolvedTheme(resolved)

    requestAnimationFrame(() => {
      const html = document.documentElement
      if (!html.classList.contains(resolved)) {
        html.classList.remove('light', 'dark')
        html.classList.add(resolved)
        html.style.colorScheme = resolved
      }
    })
  }, [theme])

  // Listen to system theme changes (only update state, not DOM if already handled)
  useEffect(() => {
    if (theme !== 'system') return
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      const newTheme = mediaQuery.matches ? 'dark' : 'light'
      setResolvedTheme(newTheme)
      requestAnimationFrame(() => {
        const html = document.documentElement
        if (!html.classList.contains(newTheme)) {
          html.classList.remove('light', 'dark')
          html.classList.add(newTheme)
          html.style.colorScheme = newTheme
        }
      })
    }
    
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
