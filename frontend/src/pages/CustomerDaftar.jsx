import { useEffect, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import AuthPelangganLayout from '../components/AuthPelangganLayout'
import { AuthPelangganField, PasswordField } from '../components/AuthPelangganField'
import Button from '../components/Button'
import { ambilData } from '../lib/api'

function nomorHpValid(nilai) {
  const teks = nilai.trim()
  const digit = teks.replace(/\D/g, '')
  return /^\+?[\d\s().-]+$/.test(teks) && digit.length >= 8 && digit.length <= 15
}

export default function CustomerDaftar() {
  const [form, setForm] = useState({
    nama_lengkap: '',
    email: '',
    nomor_hp: '',
    password: '',
    konfirmasi_password: '',
  })
  const [errors, setErrors] = useState({})
  const [pesan, setPesan] = useState('')
  const [memeriksa, setMemeriksa] = useState(true)
  const [memuat, setMemuat] = useState(false)
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

  function ubah(kolom, nilai) {
    setForm((sebelumnya) => ({ ...sebelumnya, [kolom]: nilai }))
    setErrors((sebelumnya) => ({ ...sebelumnya, [kolom]: '' }))
    setPesan('')
  }

  async function daftar(event) {
    event.preventDefault()
    if (memuat) return
    const nextErrors = {}
    if (!form.nama_lengkap.trim()) nextErrors.nama_lengkap = 'Nama lengkap wajib diisi.'
    if (!form.email.trim()) nextErrors.email = 'Email wajib diisi.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) nextErrors.email = 'Format email tidak valid.'
    if (!form.nomor_hp.trim()) nextErrors.nomor_hp = 'Nomor HP wajib diisi.'
    else if (!nomorHpValid(form.nomor_hp)) nextErrors.nomor_hp = 'Format nomor HP tidak valid.'
    if (!form.password) nextErrors.password = 'Password wajib diisi.'
    else if (form.password.length < 6) nextErrors.password = 'Password minimal 6 karakter.'
    if (!form.konfirmasi_password) nextErrors.konfirmasi_password = 'Konfirmasi password wajib diisi.'
    else if (form.password !== form.konfirmasi_password) nextErrors.konfirmasi_password = 'Konfirmasi password tidak sama.'
    setErrors(nextErrors)
    setPesan('')
    if (Object.keys(nextErrors).length > 0) return

    setMemuat(true)
    try {
      await ambilData('/api/pelanggan_auth.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aksi: 'daftar', ...form }),
      })
      window.localStorage.setItem('tokokita_mode', 'pelanggan')
      navigate('/pelanggan', { replace: true })
    } catch (error) {
      setPesan(error.message || 'Pendaftaran gagal. Silakan coba kembali.')
    } finally {
      setMemuat(false)
    }
  }

  if (memeriksa) {
    return <main className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-500 dark:bg-slate-950">Memeriksa sesi pelanggan...</main>
  }
  if (window.localStorage.getItem('tokokita_mode') === 'pelanggan') return <Navigate to="/pelanggan" replace />

  return (
    <AuthPelangganLayout title="Buat akun pelanggan" description="Daftar untuk terhubung dengan data pelanggan dan melihat produk TokoKita.">
      <form onSubmit={daftar} noValidate className="mt-6 space-y-4">
        <AuthPelangganField
          id="customer-name"
          label="Nama lengkap"
          value={form.nama_lengkap}
          onChange={(event) => ubah('nama_lengkap', event.target.value)}
          error={errors.nama_lengkap}
          placeholder="Nama lengkap"
          autoComplete="name"
          autoFocus
        />
        <AuthPelangganField
          id="customer-email"
          label="Email"
          value={form.email}
          onChange={(event) => ubah('email', event.target.value)}
          error={errors.email}
          type="email"
          placeholder="email@contoh.com"
          autoComplete="email"
        />
        <AuthPelangganField
          id="customer-phone"
          label="Nomor HP"
          value={form.nomor_hp}
          onChange={(event) => ubah('nomor_hp', event.target.value)}
          error={errors.nomor_hp}
          type="tel"
          inputMode="tel"
          placeholder="081234567890"
          autoComplete="tel"
        />
        <PasswordField
          id="customer-new-password"
          label="Password"
          value={form.password}
          onChange={(event) => ubah('password', event.target.value)}
          error={errors.password}
          autoComplete="new-password"
        />
        <PasswordField
          id="customer-confirm-password"
          label="Konfirmasi password"
          value={form.konfirmasi_password}
          onChange={(event) => ubah('konfirmasi_password', event.target.value)}
          error={errors.konfirmasi_password}
          autoComplete="new-password"
        />
        {pesan && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm text-rose-800 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200">{pesan}</p>}
        <Button type="submit" disabled={memuat} className="h-12 w-full rounded-xl">
          {memuat ? 'Membuat akun...' : <>Daftar <ArrowRight size={17} /></>}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
        Sudah punya akun? <Link to="/pelanggan/masuk" className="font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">Masuk</Link>
      </p>
    </AuthPelangganLayout>
  )
}
