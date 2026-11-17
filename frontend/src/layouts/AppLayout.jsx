import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

export default function AppLayout() {
  const [menuTerbuka, setMenuTerbuka] = useState(false)

  useEffect(() => {
    if (!menuTerbuka) return undefined

    const overflowSebelumnya = document.body.style.overflow
    const tanganiTombol = (event) => {
      if (event.key === 'Escape') setMenuTerbuka(false)
    }

    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', tanganiTombol)

    return () => {
      document.body.style.overflow = overflowSebelumnya
      document.removeEventListener('keydown', tanganiTombol)
    }
  }, [menuTerbuka])

  return (
    <div className="min-h-screen">
      <Sidebar
        terbuka={menuTerbuka}
        onTutup={() => setMenuTerbuka(false)}
      />

      <div className="flex min-h-screen flex-col lg:pl-[264px] print:pl-0">
        <Topbar onBukaMenu={() => setMenuTerbuka(true)} />

        <main className="relative flex-1">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-indigo-50/70 via-slate-50/0 to-transparent dark:from-indigo-500/[0.04] print:hidden"
          />
          <div className="relative mx-auto w-full max-w-7xl px-4 pb-10 pt-6 sm:px-6 sm:pt-8 lg:px-8 print:px-0 print:pb-0 print:pt-0">
            <Outlet />
          </div>
        </main>

        <footer className="border-t border-slate-200/70 px-4 py-5 dark:border-slate-800/70 print:hidden">
          <p className="mx-auto max-w-7xl text-center text-xs text-slate-400 dark:text-slate-500 sm:px-6 lg:px-8">
            TokoKita · Sistem Informasi Penjualan · XII RPL 1
          </p>
        </footer>
      </div>
    </div>
  )
}
