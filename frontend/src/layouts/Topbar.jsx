import { CalendarDays, ChevronRight, Menu, Moon, Sun } from 'lucide-react'
import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { labelHalaman } from '../lib/navigation'
import { useTheme } from '../lib/theme'

export default function Topbar({ onBukaMenu }) {
  const { gelap, gantiTema } = useTheme()
  const { pathname } = useLocation()
  const judul = labelHalaman(pathname)

  const tanggalHariIni = useMemo(
    () =>
      new Intl.DateTimeFormat('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(new Date()),
    [],
  )

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/80 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/80 print:hidden">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={onBukaMenu}
          aria-label="Buka menu navigasi"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white lg:hidden"
        >
          <Menu size={20} />
        </button>

        <div className="flex min-w-0 items-center gap-2 text-sm">
          <span className="hidden font-medium text-slate-400 dark:text-slate-500 sm:inline">
            TokoKita
          </span>
          <ChevronRight
            size={14}
            aria-hidden="true"
            className="hidden text-slate-300 dark:text-slate-600 sm:block"
          />
          <span className="truncate font-semibold text-slate-800 dark:text-slate-100">
            {judul}
          </span>
        </div>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-3">
          <div className="hidden items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 md:flex">
            <CalendarDays size={14} />
            <span className="capitalize">{tanggalHariIni}</span>
          </div>

          <button
            type="button"
            onClick={gantiTema}
            aria-label={
              gelap ? 'Aktifkan mode terang' : 'Aktifkan mode gelap'
            }
            title={gelap ? 'Mode terang' : 'Mode gelap'}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            {gelap ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <div className="hidden h-8 w-px bg-slate-200 dark:bg-slate-800 sm:block" />

          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 select-none items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-semibold text-white shadow-sm shadow-indigo-600/30">
              A
            </span>
            <div className="hidden leading-tight sm:block">
              <p className="text-sm font-medium text-slate-900 dark:text-white">
                Admin Toko
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                XII RPL 1
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
