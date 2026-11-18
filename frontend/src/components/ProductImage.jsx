import { Package } from 'lucide-react'
import { useEffect, useState } from 'react'

/**
 * Menampilkan foto produk berbentuk thumbnail. Bila produk belum punya foto
 * atau foto gagal dimuat, tampilkan ikon kotak sebagai placeholder.
 */
export default function ProductImage({
  foto,
  nama,
  className = 'h-10 w-10',
  ikonSize = 17,
}) {
  const [gagal, setGagal] = useState(false)

  useEffect(() => {
    setGagal(false)
  }, [foto])

  if (!foto || gagal) {
    return (
      <span
        aria-hidden="true"
        className={`flex shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 ${className}`}
      >
        <Package size={ikonSize} strokeWidth={1.9} />
      </span>
    )
  }

  return (
    <img
      src={foto}
      alt={`Foto produk ${nama}`}
      loading="lazy"
      onError={() => setGagal(true)}
      className={`shrink-0 rounded-lg bg-slate-100 object-cover dark:bg-slate-800 ${className}`}
    />
  )
}
