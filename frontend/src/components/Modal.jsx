import { X } from 'lucide-react'
import { useEffect } from 'react'
import { createPortal } from 'react-dom'

const ukuranKotak = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
}

export default function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
}) {
  useEffect(() => {
    if (!open) return undefined

    const tanganiTombol = (event) => {
      if (event.key === 'Escape') onClose?.()
    }

    const overflowSebelumnya = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', tanganiTombol)

    return () => {
      document.removeEventListener('keydown', tanganiTombol)
      document.body.style.overflow = overflowSebelumnya
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-end justify-center p-4 sm:items-center">
      <div
        aria-hidden="true"
        onClick={onClose}
        className="overlay-masuk absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="judul-modal"
        className={`modal-masuk relative z-10 w-full rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xl shadow-slate-900/20 dark:border-slate-700 dark:bg-slate-900 dark:shadow-black/40 sm:p-6 ${ukuranKotak[size] ?? ukuranKotak.md}`}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2
              id="judul-modal"
              className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white"
            >
              {title}
            </h2>
            {description && (
              <p className="mt-1 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup dialog"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X size={17} />
          </button>
        </div>

        <div className="mt-4">{children}</div>

        {footer && (
          <div className="mt-6 flex flex-wrap justify-end gap-2 border-t border-slate-200 pt-4 dark:border-slate-800">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}
