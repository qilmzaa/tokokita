import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

const ThemeContext = createContext(null)
const KUNCI_TEMA = 'tokokita-theme'

function temaAwal() {
  if (typeof window === 'undefined') return 'light'

  try {
    const tersimpan = window.localStorage.getItem(KUNCI_TEMA)
    if (tersimpan === 'light' || tersimpan === 'dark') return tersimpan
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light'
  } catch {
    return 'light'
  }
}

export function ThemeProvider({ children }) {
  const [tema, setTema] = useState(temaAwal)

  useEffect(() => {
    const root = document.documentElement
    const gelap = tema === 'dark'

    root.classList.toggle('dark', gelap)
    root.style.colorScheme = tema

    try {
      window.localStorage.setItem(KUNCI_TEMA, tema)
    } catch {
      /* abaikan bila localStorage tidak tersedia */
    }
  }, [tema])

  const gantiTema = useCallback(() => {
    setTema((sebelumnya) => (sebelumnya === 'dark' ? 'light' : 'dark'))
  }, [])

  const nilai = useMemo(
    () => ({ tema, gelap: tema === 'dark', gantiTema }),
    [tema, gantiTema],
  )

  return <ThemeContext.Provider value={nilai}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const konteks = useContext(ThemeContext)

  if (!konteks) {
    throw new Error('useTheme harus dipakai di dalam ThemeProvider.')
  }

  return konteks
}
