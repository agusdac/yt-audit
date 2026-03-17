const THEME_KEY = 'upscrub-theme'

export function useTheme() {
  const theme = useState<'dark' | 'light'>('theme', () => 'dark')

  const initTheme = () => {
    if (import.meta.client) {
      const stored = localStorage.getItem(THEME_KEY) as 'dark' | 'light' | null
      if (stored === 'light' || stored === 'dark') {
        theme.value = stored
      }
      document.documentElement.setAttribute('data-theme', theme.value)
    }
  }

  const toggleTheme = () => {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
    if (import.meta.client) {
      localStorage.setItem(THEME_KEY, theme.value)
      document.documentElement.setAttribute('data-theme', theme.value)
    }
  }

  return { theme, initTheme, toggleTheme }
}
