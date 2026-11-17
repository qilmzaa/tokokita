import { useState } from 'react'
import Button from './Button'
import { formatAngka, formatRupiah } from '../lib/format'
import toko from '../config/toko'

export function cetakStruk() {
  const kertas = document.getElementById('struk-kertas')
  if (!kertas) return

  document.getElementById('struk-print-root')?.remove()
  const aturanLama = document.getElementById('ukuran-halaman-struk')
  aturanLama?.remove()

  const salinan = kertas.cloneNode(true)
  salinan.removeAttribute('id')
  const akarCetak = document.createElement('div')
  akarCetak.id = 'struk-print-root'
  akarCetak.className = 'font-mono'
  akarCetak.style.width = '72mm'
  akarCetak.appendChild(salinan)
  document.body.appendChild(akarCetak)

  const tinggiMm = Math.ceil((salinan.getBoundingClientRect().height * 25.4) / 96 + 6)
  const aturan = document.createElement('style')
  aturan.id = 'ukuran-halaman-struk'
  aturan.textContent = `@page { size: 80mm ${tinggiMm}mm; margin: 0; }`
  document.head.appendChild(aturan)
  document.body.classList.add('cetak-struk')

  window.addEventListener('afterprint', () => {
    document.body.classList.remove('cetak-struk')
    document.getElementById('struk-print-root')?.remove()
    document.getElementById('ukuran-halaman-struk')?.remove()
  }, { once: true })
  window.print()
}

function tanggalStruk(nilai) {
  const bagian = String(nilai ?? '').slice(0, 10).split('-')
  return bagian.length === 3 ? `${bagian[2]}/${bagian[1]}/${bagian[0]}` : '—'
}

export default function Struk({ transaksi, tampilkanTombolCetak = false }) {
  const [uangDiterima, setUangDiterima] = useState('')
  const total = Number(transaksi.total_belanja) || 0
  const kuantitas = (transaksi.items ?? []).reduce((jumlah, item) => jumlah + Number(item.jumlah || 0), 0)
  const uang = uangDiterima === '' ? null : Number(uangDiterima)

  return (
    <div className="struk-panggung mx-auto w-full max-w-[300px]">
      <div id="struk-kertas" className="mx-auto w-full rounded-sm bg-white px-4 py-5 font-mono text-[11px] leading-relaxed text-black shadow-lg shadow-slate-900/10">
        <header className="text-center">
          <h2 className="text-base font-bold tracking-wide">{toko.nama}</h2>
          <p>{toko.alamat}</p>
          <p>Telp. {toko.telepon}</p>
        </header>
        <div className="struk-garis my-3 border-t border-dashed border-black" />
        <dl className="space-y-0.5">
          <div className="flex justify-between gap-2"><dt>No. Transaksi</dt><dd className="text-right">TRX-{String(transaksi.id_transaksi).padStart(6, '0')}</dd></div>
          <div className="flex justify-between gap-2"><dt>Tanggal</dt><dd className="text-right">{tanggalStruk(transaksi.tanggal)}</dd></div>
          <div className="flex justify-between gap-2"><dt>Pelanggan</dt><dd className="text-right">{transaksi.nama_pelanggan}</dd></div>
          <div className="flex justify-between gap-2"><dt>Kasir</dt><dd className="text-right">{toko.kasir}</dd></div>
        </dl>
        <div className="struk-garis my-3 border-t border-dashed border-black" />
        <div className="space-y-2">
          {(transaksi.items ?? []).map((item) => (
            <div key={item.id_detail}>
              <p className="break-words font-medium">{item.nama_produk}</p>
              <div className="flex items-start justify-between gap-2"><span>{formatAngka(item.jumlah)} x {formatRupiah(item.harga)}</span><span className="shrink-0 text-right">{formatRupiah(item.subtotal)}</span></div>
              {Number(item.diskon_persen) > 0 && <p className="text-[10px]">Diskon {formatAngka(item.diskon_persen)}%</p>}
            </div>
          ))}
        </div>
        <div className="struk-garis my-3 border-t border-dashed border-black" />
        <div className="flex items-center justify-between gap-2 text-sm font-bold"><span>TOTAL</span><span className="text-right">{formatRupiah(transaksi.total_belanja)}</span></div>
        <div className="mt-1 flex justify-between gap-2"><span>Jumlah item</span><span className="text-right">{formatAngka((transaksi.items ?? []).length)}</span></div>
        <div className="flex justify-between gap-2"><span>Total kuantitas</span><span className="text-right">{formatAngka(kuantitas)}</span></div>
        {uang !== null && Number.isFinite(uang) && <div className="mt-1 space-y-0.5 border-t border-dashed border-black pt-1"><div className="flex justify-between gap-2"><span>Tunai</span><span className="text-right">{formatRupiah(uang)}</span></div><div className="flex justify-between gap-2"><span>Kembali</span><span className="text-right">{formatRupiah(uang - total)}</span></div></div>}
        <div className="struk-garis my-3 border-t border-dashed border-black" />
        <footer className="space-y-1 text-center"><p>Terima kasih atas kunjungan Anda</p><p className="text-[10px]">Barang yang sudah dibeli tidak dapat ditukar/dikembalikan</p></footer>
      </div>
      <div className="struk-kontrol mt-3 space-y-2">
        <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Uang diterima (opsional)
          <input type="number" min="0" step="1" inputMode="numeric" value={uangDiterima} onChange={(event) => setUangDiterima(event.target.value)} placeholder="Masukkan nominal tunai" className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
        </label>
        {tampilkanTombolCetak && <Button className="w-full" onClick={cetakStruk}>Cetak Struk</Button>}
      </div>
    </div>
  )
}
