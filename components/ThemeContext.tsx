'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

type Theme = 'light' | 'dark'

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
}

// Valor padrão do contexto para evitar erro durante SSR
const defaultContextValue: ThemeContextType = {
  theme: 'light',
  toggleTheme: () => {},
}

const ThemeContext = createContext<ThemeContextType>(defaultContextValue)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Verificar preferência salva ou preferência do sistema
    try {
      const savedTheme = localStorage.getItem('theme') as Theme | null
      const systemPreference = typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      
      const initialTheme = savedTheme || systemPreference
      setTheme(initialTheme)
      
      // Aplicar tema ao documento de forma segura
      if (typeof document !== 'undefined') {
        document.documentElement.setAttribute('data-theme', initialTheme)
      }
    } catch (error) {
      // Ignorar erros de localStorage (SSR)
      console.warn('Erro ao carregar tema:', error)
    } finally {
      setMounted(true)
    }
  }, [])

  useEffect(() => {
    if (mounted && typeof document !== 'undefined') {
      try {
        // Salvar preferência e aplicar ao documento
        localStorage.setItem('theme', theme)
        document.documentElement.setAttribute('data-theme', theme)
      } catch (error) {
        console.warn('Erro ao salvar tema:', error)
      }
    }
  }, [theme, mounted])

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'))
  }

  // Sempre fornecer o contexto, mesmo durante a hidratação
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  // Agora sempre retorna um contexto válido (não precisa verificar undefined)
  return context
}

