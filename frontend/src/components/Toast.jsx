import {
  CheckCircle2,
  Info,
  TriangleAlert,
  X,
} from 'lucide-react'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

const ToastContext = createContext(null)

const gayaTipe = {
  sukses: {
    ikon: CheckCircle2,
    kotak: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400',
    garis: 'bg-emerald-500',
    judul: 'Berhasil',
    peran: 'status',
  },
  gagal: {
    ikon: TriangleAlert,
    kotak: 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400',
    garis: 'bg-rose-500',
    judul: 'Gagal',
    peran: 'alert',
  },
  info: {
    ikon: Info,
    kotak: 'bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400',
    garis: 'bg-sky-500',
    judul: 'Informasi',
    peran: 'status',
  },
}

function ToastItem({ toast, onTutup }) {
  const gaya = gayaTipe[toast.tipe] ?? gayaTipe.info
  const Ikon = gaya.ikon

  useEffect(() => {
    const timer = window.setTimeout(() => onTutup(toast.id), toast.durasi)
    return () => window.clearTimeout(timer)
  }, [toast.id, toast.durasi, onTutup])

  return (
    <div
      role={gaya.peran}
      className="toast-masuk pointer-events-auto relative flex items-start gap-3 overflow-hidden rounded-xl border border-slate-200/80 bg-white p-4 pr-11 shadow-lg shadow-slate-900/10 dark:border-slate-700 dark:bg-slate-900 dark:shadow-black/30"
    >
      <span
        aria-hidden="true"
        className={`absolute inset-y-0 left-0 w-1 ${gaya.garis}`}
      />
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${gaya.kotak}`}
      >
        <Ikon size={18} strokeWidth={2.2} />
      </span>
      <div className="min-w-0 flex-1 pt-0.5">
        <p className="text-sm font-semibold text-slate-900 dark:text-white">
          {gaya.judul}
        </p>
        <p className="mt-0.5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          {toast.pesan}
        </p>
      </div>
      <button
        type="button"
        onClick={() => onTutup(toast.id)}
        aria-label="Tutup notifikasi"
        className="absolute right-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:hover:bg-slate-800 dark:hover:text-slate-200"
      >
        <X size={15} />
      </button>
    </div>
  )
}

export function ToastProvider({ children }) {
  const [daftarToast, setDaftarToast] = useState([])
  const penghitung = useRef(0)

  const hapusToast = useCallback((id) => {
    setDaftarToast((sebelumnya) => sebelumnya.filter((toast) => toast.id !== id))
  }, [])

  const tampilToast = useCallback((pesan, tipe = 'sukses', durasi = 4200) => {
    penghitung.current += 1
    const id = penghitung.current
    setDaftarToast((sebelumnya) => [
      ...sebelumnya.slice(-3),
      { id, pesan, tipe, durasi },
    ])
  }, [])

  const sukses = useCallback(
    (pesan) => tampilToast(pesan, 'sukses'),
    [tampilToast],
  )
  const gagal = useCallback(
    (pesan) => tampilToast(pesan, 'gagal', 5200),
    [tampilToast],
  )
  const info = useCallback(
    (pesan) => tampilToast(pesan, 'info'),
    [tampilToast],
  )

  const nilai = useMemo(
    () => ({ sukses, gagal, info }),
    [sukses, gagal, info],
  )

  return (
    <ToastContext.Provider value={nilai}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-4 bottom-4 z-[100] flex flex-col gap-2.5 sm:inset-x-auto sm:bottom-6 sm:right-6 sm:w-[380px]"
      >
        {daftarToast.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onTutup={hapusToast} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const konteks = useContext(ToastContext)

  if (!konteks) {
    throw new Error('useToast harus dipakai di dalam ToastProvider.')
  }

  return konteks
}
