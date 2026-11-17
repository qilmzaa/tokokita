import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Moon,
  ShieldCheck,
  Store,
  Sun,
  UserRound,
} from 'lucide-react'
import Button from '../components/Button'
import { ambilData } from '../lib/api'
import { useTheme } from '../lib/theme'

export default function Login() {
  const [namaPengguna, setNamaPengguna] = useState('')
  const [kataSandi, setKataSandi] = useState('')
  const [tampilkanSandi, setTampilkanSandi] = useState(false)
  const [ingatSaya, setIngatSaya] = useState(true)
  const [pesan, setPesan] = useState('')
  const [sedangMasuk, setSedangMasuk] = useState(false)
  const { gelap, gantiTema } = useTheme()
  const navigate = useNavigate()
  const lokasi = useLocation()

  async function masuk(event) {
    event.preventDefault()
    if (sedangMasuk) return

    setSedangMasuk(true)
    setPesan('')
    try {
      await ambilData('/api/auth.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nama_pengguna: namaPengguna, kata_sandi: kataSandi, ingat_saya: ingatSaya }),
      })
      const tujuan = lokasi.state?.from || '/'
      navigate(typeof tujuan === 'string' ? tujuan : `${tujuan.pathname}${tujuan.search ?? ''}`, { replace: true })
    } catch (error) {
      setPesan(error instanceof Error ? error.message : 'Gagal masuk. Periksa kembali akun Anda.')
    } finally {
      setSedangMasuk(false)
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-4 py-8 dark:bg-slate-950 sm:px-6">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-40 h-[28rem] w-[28rem] rounded-full bg-indigo-300/25 blur-3xl dark:bg-indigo-500/10" />
        <div className="absolute -bottom-48 -right-32 h-[32rem] w-[32rem] rounded-full bg-violet-300/20 blur-3xl dark:bg-violet-500/10" />
        <div className="absolute inset-0 bg-[radial-gradient(#94a3b8_0.7px,transparent_0.7px)] bg-[size:22px_22px] opacity-[0.18] dark:opacity-[0.08]" />
      </div>

      <button
        type="button"
        onClick={gantiTema}
        aria-label={gelap ? 'Aktifkan mode terang' : 'Aktifkan mode gelap'}
        className="absolute right-5 top-5 z-10 flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white/80 text-slate-600 shadow-sm backdrop-blur transition hover:bg-white dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-300 dark:hover:bg-slate-900"
      >
        {gelap ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      <section className="relative z-[1] grid w-full max-w-5xl overflow-hidden rounded-[28px] border border-white/80 bg-white/90 shadow-2xl shadow-indigo-950/10 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/90 dark:shadow-black/30 lg:grid-cols-[1.02fr_0.98fr]">
        <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 p-10 text-white lg:flex xl:p-12">
          <div aria-hidden="true" className="absolute -right-24 -top-20 h-80 w-80 rounded-full border border-white/10" />
          <div aria-hidden="true" className="absolute -right-10 -top-6 h-52 w-52 rounded-full border border-white/10" />
          <div aria-hidden="true" className="absolute -bottom-28 -left-20 h-72 w-72 rounded-full bg-white/[0.06] blur-2xl" />

          <Link to="/" className="relative flex w-fit items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20 backdrop-blur"><Store size={23} /></span>
            <span><span className="block text-lg font-semibold tracking-tight">TokoKita</span><span className="text-xs text-indigo-100">Sistem Informasi Penjualan</span></span>
          </Link>

          <div className="relative my-12 max-w-md">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-indigo-50">
              <ShieldCheck size={14} /> Ruang kerja toko Anda
            </span>
            <h1 className="mt-6 text-4xl font-semibold leading-[1.12] tracking-tight xl:text-[2.8rem]">
              Kelola penjualan dengan lebih mudah.
            </h1>
            <p className="mt-4 max-w-sm text-sm leading-7 text-indigo-100">
              Pantau produk, pelanggan, transaksi, dan laporan toko dari satu tempat.
            </p>
          </div>

          <div className="relative flex items-center gap-3 border-t border-white/15 pt-5 text-xs text-indigo-100">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10"><ShieldCheck size={15} /></span>
            <span>Antarmuka untuk pengelolaan toko yang lebih tertata</span>
          </div>
        </div>

        <div className="flex items-center justify-center p-6 sm:p-10 lg:p-12 xl:p-14">
          <div className="w-full max-w-md">
            <Link to="/" className="mb-9 flex w-fit items-center gap-2.5 lg:hidden">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/20"><Store size={19} /></span>
              <span className="text-base font-semibold tracking-tight text-slate-900 dark:text-white">TokoKita</span>
            </Link>

            <div className="mb-8">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-400">Selamat datang</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">Masuk ke akun</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">Masukkan nama pengguna dan kata sandi untuk melanjutkan.</p>
            </div>

            <form onSubmit={masuk} className="space-y-5">
              <div>
                <label htmlFor="nama-pengguna" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Nama pengguna</label>
                <div className="relative">
                  <UserRound size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input id="nama-pengguna" name="username" type="text" autoComplete="username" required value={namaPengguna} onChange={(event) => { setNamaPengguna(event.target.value); setPesan('') }} placeholder="Masukkan nama pengguna" className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500" />
                </div>
              </div>

              <div>
                <label htmlFor="kata-sandi" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Kata sandi</label>
                <div className="relative">
                  <LockKeyhole size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input id="kata-sandi" name="password" type={tampilkanSandi ? 'text' : 'password'} autoComplete="current-password" required value={kataSandi} onChange={(event) => { setKataSandi(event.target.value); setPesan('') }} placeholder="Masukkan kata sandi" className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-12 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500" />
                  <button type="button" onClick={() => setTampilkanSandi((nilai) => !nilai)} aria-label={tampilkanSandi ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'} className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200">
                    {tampilkanSandi ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3">
                <label className="flex cursor-pointer items-center gap-2.5 text-sm text-slate-600 dark:text-slate-400">
                  <input type="checkbox" checked={ingatSaya} onChange={(event) => setIngatSaya(event.target.checked)} className="h-4 w-4 rounded border-slate-300 text-indigo-600 accent-indigo-600 focus:ring-indigo-500 dark:border-slate-700" />
                  Ingat saya
                </label>
                <span className="text-xs text-slate-400 dark:text-slate-500">Hubungi admin jika lupa kata sandi</span>
              </div>

              {pesan && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm leading-relaxed text-rose-800 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200">{pesan}</p>}

              <Button type="submit" disabled={sedangMasuk} className="h-12 w-full rounded-xl text-sm">
                {sedangMasuk ? 'Memeriksa akun...' : <>Masuk <ArrowRight size={17} /></>}
              </Button>
            </form>

            <p className="mt-8 text-center text-xs leading-relaxed text-slate-400 dark:text-slate-500">
              XII RPL 1 <span className="mx-1.5">·</span> Sistem Informasi Penjualan Toko
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
