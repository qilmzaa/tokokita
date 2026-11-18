import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { LoaderCircle } from 'lucide-react'
import AppLayout from '../layouts/AppLayout'
import { ambilData } from '../lib/api'
import { useSession } from '../lib/session'
import Pelanggan from './Pelanggan'
import CustomerBeranda from './CustomerBeranda'

export default function CustomerHomeRoute() {
  const [status, setStatus] = useState('memuat')
  const [profil, setProfil] = useState(null)
  const { setPengguna } = useSession()

  useEffect(() => {
    let aktif = true

    async function periksaSesi() {
      const mode = window.localStorage.getItem('tokokita_mode')

      if (mode === 'pelanggan') {
        try {
          const hasil = await ambilData('/api/pelanggan_auth.php')
          if (!aktif) return
          if (hasil?.data) {
            setProfil(hasil.data)
            setPengguna(null)
            setStatus('pelanggan')
            return
          }
        } catch {
        }
        window.localStorage.removeItem('tokokita_mode')
      }

      if (mode === 'staf') {
        try {
          const hasil = await ambilData('/api/auth.php')
          if (!aktif) return
          setPengguna(hasil?.data ?? null)
          setStatus('staf')
          return
        } catch {
          window.localStorage.removeItem('tokokita_mode')
        }
      }

      try {
        const hasilPelanggan = await ambilData('/api/pelanggan_auth.php')
        if (!aktif) return
        if (hasilPelanggan?.data) {
          window.localStorage.setItem('tokokita_mode', 'pelanggan')
          setProfil(hasilPelanggan.data)
          setPengguna(null)
          setStatus('pelanggan')
          return
        }
      } catch {
      }

      try {
        const hasilStaf = await ambilData('/api/auth.php')
        if (!aktif) return
        window.localStorage.setItem('tokokita_mode', 'staf')
        setPengguna(hasilStaf?.data ?? null)
        setStatus('staf')
      } catch {
        if (!aktif) return
        setStatus('keluar')
      }
    }

    periksaSesi()
    return () => { aktif = false }
  }, [setPengguna])

  if (status === 'memuat') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-500 dark:bg-slate-950 dark:text-slate-400">
        <span className="flex items-center gap-2"><LoaderCircle size={17} className="animate-spin" />Memeriksa sesi...</span>
      </main>
    )
  }
  if (status === 'keluar') return <Navigate to="/pelanggan/masuk" replace />
  if (status === 'pelanggan') return <CustomerBeranda profil={profil} />

  return <AppLayout><Pelanggan /></AppLayout>
}
