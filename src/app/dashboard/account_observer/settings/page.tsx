"use client";

import RoleGuard from '@/components/auth/RoleGuard';
import { useFontSize } from '@/context/FontSizeContext';
import { useTheme } from '@/context/ThemeContext';
import { useEffect } from 'react';

export default function ObserverSettings() {
  const { fontSize, setFontSize } = useFontSize();
  const { theme, setTheme, resolvedTheme } = useTheme();

  useEffect(() => {
    console.log('Theme:', theme);
    console.log('Resolved theme:', resolvedTheme);
  }, [theme, resolvedTheme]);

  return (
    <RoleGuard allowedRoles={['account_observer']}>
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="my-8 p-6 sm:p-8 border border-zinc-300 dark:border-zinc-700 rounded-2xl bg-white dark:bg-zinc-900">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight uppercase text-zinc-900 dark:text-white">Preferencias</h1>
              <p className="text-zinc-500 font-medium mt-2">Modificar preferencias de visualización en la plataforma</p>
            </div>
          <div className="grid grid-cols-2 gap-8 my-8 mx-4">
            <div className="max-w-md space-y-2">
              <label htmlFor="font-size-range" className="block text-sm font-bold text-zinc-700 dark:text-zinc-300">
                Tamaño de fuente
              </label>
              <div className="flex items-center gap-2">
              <span className="text-sm text-zinc-500">A</span>
              <input 
                id="font-size-range" 
                type="range" 
                value={fontSize} 
                min={1} 
                max={4} 
                onChange={(e) => setFontSize(Number(e.target.value) as 1 | 2 | 3 | 4)} 
                className="w-full h-2 bg-zinc-300 dark:bg-zinc-700 rounded-full appearance-none cursor-pointer accent-zinc-900 dark:accent-white" 
              />
              <span className="text-2xl text-zinc-500">A</span>
              </div>
            </div>

            <div className="space-y-3 flex flex-col items-start">
              <label htmlFor="theme-select" className="block text-sm font-bold text-zinc-700 dark:text-zinc-300">
                Tema
              </label>
              <div className="relative w-full">
                <select 
                  id="theme-select" 
                  value={theme} 
                  onChange={(e) => setTheme(e.target.value as 'light' | 'dark' | 'system')} 
                  className="w-full px-4 py-3 rounded-xl border-2 border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 outline-none transition-all font-bold appearance-none cursor-pointer"
                >
                  <option value="light">☀️ Claro</option>
                  <option value="dark">🌙 Oscuro</option>
                  <option value="system">💻 Sistema</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">
                  ↓
                </div>
              </div>
              <span className="text-xs text-zinc-500">
                Actual: {resolvedTheme === 'light' ? '☀️ Claro' : '🌙 Oscuro'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </RoleGuard>
  )
}
