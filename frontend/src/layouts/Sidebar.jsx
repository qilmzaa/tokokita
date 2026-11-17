import { GraduationCap, LogOut, Store, X } from 'lucide-react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { ambilData } from '../lib/api'
import { useToast } from '../components/Toast'
import { menuNavigasi } from '../lib/navigation'

export default function Sidebar({ terbuka, onTutup }) {
  const navigate = useNavigate()
  const { gagal } = useToast()
  const [sedangKeluar, setSedangKeluar] = useState(false)

  async function keluar() {
    if (sedangKeluar) return
    setSedangKeluar(true)
    try {
      await ambilData('/api/auth.php', { method: 'DELETE' })
      navigate('/login', { replace: true })
    } catch (error) {
      gagal(error instanceof Error ? error.message : 'Gagal keluar dari akun.')
    } finally {
      setSedangKeluar(false)
    }
  }

  return (
    <>
      <button
        type="button"
        aria-label="Tutup menu navigasi"
        onClick={onTutup}
        className={`fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm transition-opacity duration-300 lg:hidden print:hidden ${
          terbuka ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      <aside
        aria-label="Navigasi utama"
        className={`fixed inset-y-0 left-0 z-50 flex w-[264px] flex-col border-r border-slate-200/80 bg-white transition-transform duration-300 ease-out dark:border-slate-800 dark:bg-slate-900 lg:translate-x-0 print:hidden ${
          terbuka ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center gap-3 border-b border-slate-200/70 px-5 dark:border-slate-800">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-sm shadow-indigo-600/30">
            <Store size={20} strokeWidth={2.1} />
          </span>
          <div className="min-w-0 leading-tight">
            <p className="text-base font-semibold tracking-tight text-slate-900 dark:text-white">
              TokoKita
            </p>
            <p className="mt-0.5 text-[11px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Sistem Penjualan
            </p>
          </div>
          <button
            type="button"
            onClick={onTutup}
            aria-label="Tutup menu"
            className="ml-auto flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 lg:hidden"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-5">
          <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
            Menu Utama
          </p>
          <ul className="space-y-1">
            {menuNavigasi.map((item) => {
              const Ikon = item.ikon

              return (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.to === '/'}
                    onClick={onTutup}
                    className={({ isActive }) =>
                      `group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-100'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <span
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
                            isActive
                              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                              : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200 group-hover:text-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:group-hover:bg-slate-700 dark:group-hover:text-slate-200'
                          }`}
                        >
                          <Ikon size={17} strokeWidth={2} />
                        </span>
                        <span className="truncate">{item.label}</span>
                        {isActive && (
                          <span className="ml-auto h-1.5 w-1.5 rounded-full bg-indigo-500 dark:bg-indigo-400" />
                        )}
                      </>
                    )}
                  </NavLink>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="border-t border-slate-200/70 p-4 dark:border-slate-800">
          <button type="button" onClick={keluar} disabled={sedangKeluar} className="mb-3 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-500 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50 dark:text-slate-400 dark:hover:bg-rose-500/10 dark:hover:text-rose-300">
            <LogOut size={16} />{sedangKeluar ? 'Keluar...' : 'Keluar'}
          </button>
          <div className="flex items-start gap-3 rounded-lg bg-slate-50 p-3 dark:bg-slate-800/50">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-indigo-600 shadow-sm dark:bg-slate-900 dark:text-indigo-400">
              <GraduationCap size={18} />
            </span>
            <div className="min-w-0 leading-tight">
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                Proyek Sekolah
              </p>
              <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                XII RPL 1 · 2026
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
