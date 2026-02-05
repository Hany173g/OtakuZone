'use client'

import { Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'

type Theme = 'light' | 'dark'

function applyTheme(theme: Theme) {
  if (typeof document === 'undefined') return
  document.documentElement.classList.toggle('dark', theme === 'dark')
}

export default function ThemeToggle() {
  const [mounted, setMounted] = useState(false)
  const [theme, setTheme] = useState<Theme>('light')

  useEffect(() => {
    try {
      const stored = localStorage.getItem('theme') as Theme | null
      if (stored === 'dark' || stored === 'light') {
        setTheme(stored)
        applyTheme(stored)
        setMounted(true)
        return
      }

      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      const initial: Theme = prefersDark ? 'dark' : 'light'
      setTheme(initial)
      applyTheme(initial)
      setMounted(true)
    } catch {
      // ignore
      setMounted(true)
    }
  }, [])

  const toggle = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    applyTheme(next)
    try {
      localStorage.setItem('theme', next)
    } catch {
      // ignore
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 dark:border-slate-700 bg-white/70 dark:bg-slate-950/70 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-900 transition"
      title={theme === 'dark' ? 'الوضع الفاتح' : 'الوضع الداكن'}
      aria-label={theme === 'dark' ? 'الوضع الفاتح' : 'الوضع الداكن'}
    >
      {mounted && (
        <>
          <Sun
            className={`absolute h-5 w-5 transition-all duration-300 ${
              theme === 'dark' ? 'rotate-0 scale-100 opacity-100' : 'rotate-90 scale-0 opacity-0'
            }`}
          />
          <Moon
            className={`absolute h-5 w-5 transition-all duration-300 ${
              theme === 'dark' ? '-rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'
            }`}
          />
        </>
      )}
    </button>
  )
}
