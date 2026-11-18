import { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { LoaderCircle } from 'lucide-react'
import { ambilData } from '../lib/api'
import { useSession } from '../lib/session'

export default function AuthGate({ children }) {
  const [status, setStatus] = useState('memuat')
  const lokasi = useLocation()
  const { setPengguna } = useSession()

  useEffect(() => {
    let aktif = true

    async function verifikasiSesi() {
      if (window.localStorage.getItem('tokokita_mode') === 'pelanggan') {
        try {
          const hasil = await ambilData('/api/pelanggan_auth.php')
          if (!aktif) return
          if (hasil?.data) {
            setPengguna(null)
            setStatus('pelanggan')
            return
          }
        } catch {
        }
        window.localStorage.removeItem('tokokita_mode')
      }

      try {
        const hasil = await ambilData('/api/auth.php')
        if (!aktif) return
        window.localStorage.setItem('tokokita_mode', 'staf')
        setPengguna(hasil?.data ?? null)
        setStatus('masuk')
      } catch {
        try {
          const hasil = await ambilData('/api/pelanggan_auth.php')
          if (!aktif) return
          if (hasil?.data) {
            window.localStorage.setItem('tokokita_mode', 'pelanggan')
            setPengguna(null)
            setStatus('pelanggan')
          } else {
            setPengguna(null)
            setStatus('keluar')
          }
        } catch {
          if (!aktif) return
          setPengguna(null)
          setStatus('keluar')
        }
      }
    }

    verifikasiSesi()

    return () => { aktif = false }
  }, [setPengguna])

  if (status === 'memuat') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-500 dark:bg-slate-950 dark:text-slate-400">
        <span className="flex items-center gap-2"><LoaderCircle size={17} className="animate-spin" />Memeriksa sesi...</span>
      </main>
    )
  }

  if (status === 'keluar') {
    return <Navigate to="/login" replace state={{ from: `${lokasi.pathname}${lokasi.search}` }} />
  }

  if (status === 'pelanggan') {
    return <Navigate to="/pelanggan" replace />
  }

  return children
}
