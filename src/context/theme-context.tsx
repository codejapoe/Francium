import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'dark' | 'light' | 'neon' | 'system'

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const initialState: ThemeProviderState = {
  theme: 'system',
  setTheme: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'theme',
  ...props
}: ThemeProviderProps) {
    const [theme, _setTheme] = useState<Theme>(() => {
        const storedTheme = localStorage.getItem(storageKey)
        if (!storedTheme) {
            console.log(defaultTheme);
            localStorage.setItem(storageKey, defaultTheme)
        }
        return (storedTheme as Theme) || defaultTheme
    })

	useEffect(() => {
    const root = window.document.documentElement
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const applyTheme = (theme: Theme) => {
			root.classList.remove('light', 'dark', 'neon') // Add neon to removal
			const systemTheme = mediaQuery.matches ? 'dark' : 'light'
			const effectiveTheme = theme === 'system' ? systemTheme : theme
			root.classList.add(effectiveTheme)

			// Apply specific styles for neon theme
			if (effectiveTheme === 'neon') {
			root.style.setProperty('--background', '#12263f')
			root.style.setProperty('--foreground', 'white')
			root.style.setProperty('--primary', '#2c7be5')
			} else {
			root.style.removeProperty('--background')
			root.style.removeProperty('--foreground')
			root.style.removeProperty('--primary')
			}
    }

    const handleChange = () => {
      if (theme === 'system') {
        applyTheme('system')
      }
    }

    applyTheme(theme)

    mediaQuery.addEventListener('change', handleChange)

    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme])

  const setTheme = (theme: Theme) => {
    localStorage.setItem(storageKey, theme)
    _setTheme(theme)
  }

  const value = {
    theme,
    setTheme,
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined)
    throw new Error('useTheme must be used within a ThemeProvider')

  return context
}