import { createContext, useContext, useEffect, useState } from 'react'

export type ThemeId = 'finex' | 'dark' | 'light' | 'ocean' | 'ember' | 'forest'

export type ThemeDef = {
  id:      ThemeId
  label:   string
  swatches: [string, string, string]  // base, accent, accent-hi
}

export const THEMES: ThemeDef[] = [
  { id: 'finex',  label: 'Finex',      swatches: ['#F7F3EC', '#A9541A', '#C9A358'] },
  { id: 'dark',   label: 'Nova Dark',  swatches: ['#08080F', '#6366F1', '#818CF8'] },
  { id: 'light',  label: 'Nova Light', swatches: ['#F8F9FC', '#4F46E5', '#6366F1'] },
  { id: 'ocean',  label: 'Ocean',      swatches: ['#040D18', '#0EA5E9', '#38BDF8'] },
  { id: 'ember',  label: 'Ember',      swatches: ['#0F0800', '#F97316', '#FB923C'] },
  { id: 'forest', label: 'Forest',     swatches: ['#030A04', '#22C55E', '#4ADE80'] },
]

type ThemeCtx = { theme: ThemeId; setTheme: (t: ThemeId) => void }

const Ctx = createContext<ThemeCtx>({ theme: 'finex', setTheme: () => {} })

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>(() => {
    return (localStorage.getItem('theme') as ThemeId) ?? 'finex'
  })

  const setTheme = (t: ThemeId) => {
    setThemeState(t)
    localStorage.setItem('theme', t)
  }

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'finex') root.removeAttribute('data-theme')
    else root.setAttribute('data-theme', theme)
  }, [theme])

  return <Ctx.Provider value={{ theme, setTheme }}>{children}</Ctx.Provider>
}

export const useTheme = () => useContext(Ctx)
