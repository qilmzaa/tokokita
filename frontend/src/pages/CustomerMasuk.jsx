import { useEffect, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import AuthPelangganLayout from '../components/AuthPelangganLayout'
import { AuthPelangganField, PasswordField } from '../components/AuthPelangganField'
import Button from '../components/Button'
import Modal from '../components/Modal'
import { ambilData } from '../lib/api'

function identifierValid(nilai) {
  const teks = nilai.trim()
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(teks)) return true
  const digit = teks.replace(/\D/g, '')
  if (/^\+?[\d\s().-]+$/.test(teks) && digit.length >= 8 && digit.length <= 15) return true
  return /^[a-zA-Z0-9._-]{3,50}$/.test(teks)
}

export default function CustomerMasuk() {
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [ingatSaya, setIngatSaya] = useState(true)
  const [errors, setErrors] = useState({})
  const [pesan, setPesan] = useState('')
  const [memeriksa, setMemeriksa] = useState(true)
  const [memuat, setMemuat] = useState(false)
  const [lupaTerbuka, setLupaTerbuka] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    let aktif = true
    ambilData('/api/pelanggan_auth.php')
      .then((hasil) => {
        if (!aktif) return
        if (hasil?.data) {
          window.localStorage.setItem('tokokita_mode', 'pelanggan')
          setMemeriksa(false)
          navigate('/pelanggan', { replace: true })
          return
        }
        if (window.localStorage.getItem('tokokita_mode') === 'pelanggan') {
          window.localStorage.removeItem('tokokita_mode')
        }
        setMemeriksa(false)
      })
      .catch(() => {
        if (!aktif) return
        if (window.localStorage.getItem('tokokita_mode') === 'pelanggan') {
          window.localStorage.removeItem('tokokita_mode')
        }
        setMemeriksa(false)
      })
    return () => { aktif = false }
  }, [navigate])

  async function masuk(event) {
    event.preventDefault()
    if (memuat) return
    const nextErrors = {}
    if (!identifier.trim()) nextErrors.identifier = 'Username, email, atau nomor HP wajib diisi.'
    else if (!identifierValid(identifier)) nextErrors.identifier = 'Masukkan username, email, atau nomor HP yang valid.'
    if (!password) nextErrors.password = 'Password wajib diisi.'
    setErrors(nextErrors)
    setPesan('')
    if (Object.keys(nextErrors).length > 0) return

    setMemuat(true)
    try {
      await ambilData('/api/pelanggan_auth.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aksi: 'masuk', identifier: identifier.trim(), password, ingat_saya: ingatSaya }),
      })
      window.localStorage.setItem('tokokita_mode', 'pelanggan')
      navigate('/pelanggan', { replace: true })
    } catch (error) {
      const pesanError = error.message || ''
      setPesan(pesanError.includes('terhubung') || pesanError.includes('Respons server')
        ? pesanError
        : 'Username/email/nomor HP atau password salah.')
    } finally {
      setMemuat(false)
    }
  }

  if (memeriksa) {
    return <main className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-500 dark:bg-slate-950">Memeriksa sesi pelanggan...</main>
  }
  if (window.localStorage.getItem('tokokita_mode') === 'pelanggan') return <Navigate to="/pelanggan" replace />

  return (
    <AuthPelangganLayout title="Masuk ke TokoKita" description="Masuk untuk melihat produk dan pengalaman belanja Anda.">
      <form onSubmit={masuk} noValidate className="mt-7 space-y-5">
        <AuthPelangganField
          id="customer-identifier"
          label="Username, email, atau nomor HP"
          value={identifier}
          onChange={(event) => {
            setIdentifier(event.target.value)
            setErrors((nilai) => ({ ...nilai, identifier: '' }))
            setPesan('')
          }}
          error={errors.identifier}
          placeholder="user, email@contoh.com, atau 0812..."
          autoComplete="username"
          autoFocus
        />
        <PasswordField
          id="customer-password"
          label="Password"
          value={password}
          onChange={(event) => {
            setPassword(event.target.value)
            setErrors((nilai) => ({ ...nilai, password: '' }))
            setPesan('')
          }}
          error={errors.password}
          autoComplete="current-password"
        />

        <div className="flex items-center justify-between gap-3">
          <label className="flex cursor-pointer items-center gap-2.5 text-sm text-slate-600 dark:text-slate-400">
            <input type="checkbox" checked={ingatSaya} onChange={(event) => setIngatSaya(event.target.checked)} className="h-4 w-4 rounded border-slate-300 accent-indigo-600 focus:ring-indigo-500 dark:border-slate-700" />
            Ingat saya
          </label>
          <button type="button" onClick={() => setLupaTerbuka(true)} className="text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">Lupa password?</button>
        </div>

        {pesan && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm text-rose-800 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200">{pesan}</p>}

        <Button type="submit" disabled={memuat} className="h-12 w-full rounded-xl">
          {memuat ? 'Memeriksa akun...' : <>Masuk <ArrowRight size={17} /></>}
        </Button>
      </form>

      <p className="mt-7 text-center text-sm text-slate-500 dark:text-slate-400">
        Belum punya akun? <Link to="/pelanggan/daftar" className="font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">Daftar</Link>
      </p>

      <Modal open={lupaTerbuka} onClose={() => setLupaTerbuka(false)} title="Lupa password?" description="Fitur pemulihan password belum tersedia. Silakan hubungi admin toko untuk bantuan." footer={<Button onClick={() => setLupaTerbuka(false)}>Mengerti</Button>} />
    </AuthPelangganLayout>
  )
}
