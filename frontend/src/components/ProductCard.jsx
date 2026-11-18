import { Ban, Plus } from 'lucide-react'
import ProductImage from './ProductImage'
import { formatAngka, formatRupiah } from '../lib/format'

export default function ProductCard({ produk, onTambah }) {
  const habis = Number(produk.stok) < 1

  return (
    <button
      type="button"
      onClick={() => onTambah(produk)}
      disabled={habis}
      className="group relative flex min-h-48 flex-col rounded-xl border border-slate-200 bg-white p-3 text-left shadow-sm transition hover:border-indigo-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-70 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-500/50"
    >
      <ProductImage foto={produk.foto} nama={produk.nama_produk} className="h-28 w-full rounded-lg" ikonSize={28} />
      {habis && <span className="absolute right-5 top-5 rounded-full bg-slate-900/80 px-2.5 py-1 text-[11px] font-semibold text-white">Habis</span>}
      <span className="mt-3 line-clamp-2 min-h-10 text-sm font-semibold text-slate-800 dark:text-slate-100">{produk.nama_produk}</span>
      <span className="mt-1 text-sm font-bold text-indigo-600 dark:text-indigo-300">{formatRupiah(produk.harga)}</span>
      <span className={`mt-auto flex items-center justify-between pt-2 text-xs ${habis ? 'text-rose-500' : 'text-slate-500 dark:text-slate-400'}`}>
        <span>{habis ? 'Stok habis' : `Stok ${formatAngka(produk.stok)}`}</span>
        {habis ? <Ban size={15} /> : <Plus size={16} className="text-indigo-500 transition group-hover:scale-110" />}
      </span>
    </button>
  )
}
