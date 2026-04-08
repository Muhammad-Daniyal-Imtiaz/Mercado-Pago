'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

type FontSize = 1 | 2 | 3 | 4

interface FontSizeContextType {
  fontSize: FontSize
  setFontSize: (size: FontSize) => void
  fontSizeClass: string
}

const FontSizeContext = createContext<FontSizeContextType | undefined>(undefined)

const fontSizeMap: Record<FontSize, string> = {
  1: 'text-sm',
  2: 'text-base',
  3: 'text-lg',
  4: 'text-2xl',
}

export function FontSizeProvider({ children }: { children: ReactNode }) {
  const [fontSize, setFontSizeState] = useState<FontSize>(2)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Load from localStorage on mount
    const saved = localStorage.getItem('fontSize')
    if (saved) {
      const size = parseInt(saved, 10) as FontSize
      if (size >= 1 && size <= 4) {
        setFontSizeState(size)
      }
    }
    setMounted(true)
  }, [])

  const setFontSize = (size: FontSize) => {
    setFontSizeState(size)
    localStorage.setItem('fontSize', size.toString())
  }

  const fontSizeClass = fontSizeMap[fontSize]

  // Apply font size class to html element
  useEffect(() => {
    if (mounted) {
      const html = document.documentElement
      // Remove old size classes
      Object.values(fontSizeMap).forEach(cls => html.classList.remove(cls))
      // Add new size class
      html.classList.add(fontSizeClass)
    }
  }, [fontSize, fontSizeClass, mounted])

  return (
    <FontSizeContext.Provider value={{ fontSize, setFontSize, fontSizeClass }}>
      {children}
    </FontSizeContext.Provider>
  )
}

export function useFontSize() {
  const context = useContext(FontSizeContext)
  if (context === undefined) {
    throw new Error('useFontSize must be used within a FontSizeProvider')
  }
  return context
}
