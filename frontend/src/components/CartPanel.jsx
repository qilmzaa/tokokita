import { Minus, Plus, ShoppingCart, Trash2, UserRound } from 'lucide-react'
import Button from './Button'
import ProductImage from './ProductImage'
import { formatAngka, formatRupiah } from '../lib/format'

const inputClass = 'h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white'

export default function CartPanel({
  idAwalan,
  baris,
  subtotal,
  diskon,
  tipeDiskon,
  onTipeDiskon,
  onDiskon,
  idPelanggan,
  pelanggan,
  onPelanggan,
  metode,
  onMetode,
  uang,
  onUang,
  total,
  onJumlah,
  onHapus,
  onKosongkan,
  onBayar,
  bolehBayar,
  membayar,
}) {
  const uangAngka = Number(uang) || 0
  const kembalian = Math.max(0, uangAngka - total)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300"><ShoppingCart size={17} /></span>
          <div><h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Keranjang</h2><p className="text-xs text-slate-500 dark:text-slate-400">{formatAngka(baris.length)} jenis barang</p></div>
        </div>
        {baris.length > 0 && <Button variant="dangerGhost" size="sm" onClick={onKosongkan}><Trash2 size={14} />Kosongkan</Button>}
      </div>

      {baris.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 px-4 py-8 text-center dark:border-slate-700">
          <ShoppingCart size={25} className="mx-auto text-slate-300 dark:text-slate-600" />
          <p className="mt-2 text-sm font-medium text-slate-700 dark:text-slate-200">Keranjang masih kosong</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Pilih produk untuk memulai penjualan.</p>
        </div>
      ) : (
        <div className="max-h-[36vh] space-y-3 overflow-y-auto pr-1 lg:max-h-[40vh]">
          {baris.map(({ item, produk }) => produk ? (
            <div key={item.id_produk} className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
              <div className="flex items-start gap-2.5">
                <ProductImage foto={produk.foto} nama={produk.nama_produk} className="h-11 w-11" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">{produk.nama_produk}</p>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{formatRupiah(produk.harga)} · stok {formatAngka(produk.stok)}</p>
                </div>
                <Button variant="dangerGhost" size="icon-sm" onClick={() => onHapus(item.id_produk)} aria-label={`Hapus ${produk.nama_produk}`}><Trash2 size={15} /></Button>
              </div>
              <div className="mt-3 flex items-center justify-between gap-3">
                <div className="flex h-8 items-center overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
                  <button type="button" className="flex h-full w-8 items-center justify-center text-slate-500 hover:bg-slate-100 disabled:opacity-40 dark:hover:bg-slate-800" onClick={() => onJumlah(item.id_produk, item.jumlah - 1)} disabled={item.jumlah <= 1} aria-label={`Kurangi ${produk.nama_produk}`}><Minus size={13} /></button>
                  <input aria-label={`Jumlah ${produk.nama_produk}`} type="number" min="1" max={produk.stok} value={item.jumlah} onChange={(event) => onJumlah(item.id_produk, event.target.value)} className="h-full w-12 border-x border-slate-200 bg-transparent text-center text-sm text-slate-800 outline-none dark:border-slate-700 dark:text-white" />
                  <button type="button" className="flex h-full w-8 items-center justify-center text-slate-500 hover:bg-slate-100 disabled:opacity-40 dark:hover:bg-slate-800" onClick={() => onJumlah(item.id_produk, item.jumlah + 1)} disabled={item.jumlah >= Number(produk.stok)} aria-label={`Tambah ${produk.nama_produk}`}><Plus size={13} /></button>
                </div>
                <span className="text-sm font-semibold text-slate-900 dark:text-white">{formatRupiah(Number(produk.harga) * item.jumlah * (1 - Number(item.diskon_persen || 0) / 100))}</span>
              </div>
              {item.jumlah > Number(produk.stok) && <p className="mt-2 text-xs text-rose-600">Jumlah melebihi stok tersedia.</p>}
            </div>
          ) : (
            <div key={item.id_produk} className="flex items-center justify-between rounded-lg bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
              <span>Produk #{item.id_produk} tidak tersedia.</span><Button variant="dangerGhost" size="icon-sm" onClick={() => onHapus(item.id_produk)} aria-label="Hapus produk tidak tersedia"><Trash2 size={15} /></Button>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-3 border-t border-slate-200 pt-4 dark:border-slate-800">
        <label className="block text-xs font-medium text-slate-600 dark:text-slate-300" htmlFor={`${idAwalan}-pelanggan`}><span className="mb-1.5 flex items-center gap-1.5"><UserRound size={14} />Pelanggan</span>
          <select id={`${idAwalan}-pelanggan`} value={idPelanggan} onChange={(event) => onPelanggan(event.target.value)} className={inputClass}><option value="">Umum</option>{pelanggan.map((item) => <option key={item.id_pelanggan} value={item.id_pelanggan}>{item.nama_pelanggan}</option>)}</select>
        </label>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-300" htmlFor={`${idAwalan}-diskon`}>Diskon transaksi</label>
          <div className="flex gap-2">
            <select aria-label="Jenis diskon" value={tipeDiskon} onChange={(event) => onTipeDiskon(event.target.value)} className={`${inputClass} w-28 shrink-0`}><option value="nominal">Nominal</option><option value="persen">Persen</option></select>
            <div className="relative min-w-0 flex-1">
              {tipeDiskon === 'nominal' && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">Rp</span>}
              <input id={`${idAwalan}-diskon`} type="number" min="0" max={tipeDiskon === 'persen' ? 100 : subtotal} step={tipeDiskon === 'persen' ? '0.01' : '1000'} value={diskon} onChange={(event) => onDiskon(event.target.value)} className={`${inputClass} ${tipeDiskon === 'nominal' ? 'pl-9' : 'pr-8'}`} />
              {tipeDiskon === 'persen' && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">%</span>}
            </div>
          </div>
        </div>

        <label className="block text-xs font-medium text-slate-600 dark:text-slate-300" htmlFor={`${idAwalan}-metode`}>Metode pembayaran
          <select id={`${idAwalan}-metode`} value={metode} onChange={(event) => onMetode(event.target.value)} className={`${inputClass} mt-1.5`}><option>Tunai</option><option>QRIS</option><option>Transfer</option></select>
        </label>

        {metode === 'Tunai' && <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-300" htmlFor={`${idAwalan}-uang`}>Uang diterima</label>
          <input id={`${idAwalan}-uang`} type="number" min="0" step="1000" inputMode="numeric" value={uang} onChange={(event) => onUang(event.target.value)} placeholder="Masukkan nominal" className={inputClass} />
          <div className="mt-2 flex flex-wrap gap-1.5">
            {[['Pas', total], ['50.000', 50000], ['100.000', 100000]].map(([label, amount]) => <button key={label} type="button" onClick={() => onUang(String(amount))} className="rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:border-indigo-300 hover:text-indigo-600 dark:border-slate-700 dark:text-slate-300">{label}</button>)}
          </div>
          <div className="mt-2 flex items-center justify-between text-xs"><span className="text-slate-500 dark:text-slate-400">Kembalian</span><strong className={uangAngka < total ? 'text-rose-600' : 'text-emerald-600 dark:text-emerald-400'}>{formatRupiah(kembalian)}</strong></div>
        </div>}

        <div className="space-y-2 border-t border-dashed border-slate-200 pt-3 dark:border-slate-700">
          <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400"><span>Subtotal</span><span>{formatRupiah(subtotal)}</span></div>
          <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400"><span>Diskon</span><span>- {formatRupiah(diskon === '' ? 0 : tipeDiskon === 'persen' ? subtotal * Number(diskon || 0) / 100 : Number(diskon || 0))}</span></div>
          <div className="flex items-center justify-between pt-1"><span className="text-sm font-semibold text-slate-800 dark:text-slate-100">Total</span><span className="text-lg font-bold text-indigo-600 dark:text-indigo-300">{formatRupiah(total)}</span></div>
        </div>
        <Button className="w-full" disabled={!bolehBayar || membayar} onClick={onBayar}>{membayar ? 'Memproses pembayaran...' : 'Bayar'}</Button>
        {!bolehBayar && baris.length > 0 && <p className="text-center text-xs text-rose-600 dark:text-rose-400">Periksa jumlah stok dan uang yang diterima.</p>}
      </div>
    </div>
  )
}
