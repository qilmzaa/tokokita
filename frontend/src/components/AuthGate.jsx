import { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { LoaderCircle } from 'lucide-react'
import { ambilData } from '../lib/api'

export default function AuthGate({ children }) {
  const [status, setStatus] = useState('memuat')
  const lokasi = useLocation()

  useEffect(() => {
    let aktif = true

    ambilData('/api/auth.php')
      .then(() => { if (aktif) setStatus('masuk') })
      .catch(() => { if (aktif) setStatus('keluar') })

    return () => { aktif = false }
  }, [])

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

  return children
}
