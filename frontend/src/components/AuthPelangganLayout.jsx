import { Moon, Store, Sun } from 'lucide-react'
import { useTheme } from '../lib/theme'

export default function AuthPelangganLayout({ title, description, children }) {
  const { gelap, gantiTema } = useTheme()

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
          <div className="relative flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20"><Store size={23} /></span>
            <span><span className="block text-lg font-semibold">TokoKita</span><span className="text-xs text-indigo-100">Belanja mudah, nyaman, dan aman</span></span>
          </div>
          <div className="relative my-12 max-w-md">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-100">Ruang belanja Anda</p>
            <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-tight xl:text-[2.8rem]">Semua kebutuhan toko dalam satu tempat.</h1>
            <p className="mt-4 max-w-sm text-sm leading-7 text-indigo-100">Masuk atau buat akun pelanggan untuk melihat pilihan produk TokoKita.</p>
          </div>
          <p className="relative border-t border-white/15 pt-5 text-xs text-indigo-100">TokoKita · Sistem Informasi Penjualan</p>
        </div>

        <div className="flex items-center justify-center p-6 sm:p-10 lg:p-12 xl:p-14">
          <div className="w-full max-w-md">
            <div className="mb-8 lg:hidden">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 text-white"><Store size={20} /></span>
              <p className="mt-3 text-base font-semibold text-slate-900 dark:text-white">TokoKita</p>
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-400">Akun Pelanggan</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">{title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{description}</p>
            {children}
          </div>
        </div>
      </section>
    </main>
  )
}
