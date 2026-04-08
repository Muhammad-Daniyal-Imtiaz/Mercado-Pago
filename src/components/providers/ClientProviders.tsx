'use client'

import { ReactNode } from 'react'
import { FontSizeProvider } from '@/context/FontSizeContext'
import { ThemeProvider } from '@/context/ThemeContext'

export function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <FontSizeProvider>
        {children}
      </FontSizeProvider>
    </ThemeProvider>
  )
}
