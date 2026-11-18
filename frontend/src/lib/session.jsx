import { createContext, useContext, useMemo, useState } from 'react'

const SessionContext = createContext(null)

export function SessionProvider({ children }) {
  const [pengguna, setPengguna] = useState(null)
  const nilai = useMemo(() => ({ pengguna, setPengguna }), [pengguna])

  return <SessionContext.Provider value={nilai}>{children}</SessionContext.Provider>
}

export function useSession() {
  const konteks = useContext(SessionContext)
  if (!konteks) {
    throw new Error('useSession harus dipakai di dalam SessionProvider.')
  }
  return konteks
}
