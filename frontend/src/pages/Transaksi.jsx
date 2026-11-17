import {
  CalendarDays,
  Eye,
  Loader2,
  Plus,
  ReceiptText,
  RefreshCw,
  ShoppingCart,
  TriangleAlert,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Badge from '../components/Badge'
import Button from '../components/Button'
import Card from '../components/Card'
import EmptyState from '../components/EmptyState'
import Modal from '../components/Modal'
import PageHeader from '../components/PageHeader'
import Skeleton from '../components/Skeleton'
import Struk from '../components/Struk'
import { ambilData } from '../lib/api'
import { formatAngka, formatRupiah, formatTanggal } from '../lib/format'

function inisial(nama = '') {
  const bagian = nama.trim().split(/\s+/).filter(Boolean).slice(0, 2)
  if (!bagian.length) return '?'
  return bagian.map((kata) => kata[0]).join('').toUpperCase()
}

function DetailTransaksi({ transaksi }) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-3 rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50 sm:grid-cols-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Pelanggan
          </p>
          <p className="mt-1 text-sm font-medium text-slate-800 dark:text-slate-100">
            {transaksi.nama_pelanggan}
          </p>
          {transaksi.kota && (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {transaksi.kota}
            </p>
          )}
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Tanggal
          </p>
          <p className="mt-1 text-sm font-medium text-slate-800 dark:text-slate-100">
            {formatTanggal(transaksi.tanggal)}
          </p>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Total Belanja
          </p>
          <p className="mt-1 text-base font-semibold text-slate-900 dark:text-white">
            {formatRupiah(transaksi.total_belanja)}
          </p>
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
            Rincian Barang
          </h3>
          <Badge variant="indigo">
            {formatAngka(transaksi.items.length)} barang
          </Badge>
        </div>

        <div className="space-y-2 sm:hidden">
          {transaksi.items.map((item) => (
            <div
              key={item.id_detail}
              className="rounded-lg border border-slate-200 p-3 dark:border-slate-800"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                    {item.nama_produk}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    {item.nama_kategori}
                  </p>
                </div>
                <p className="shrink-0 text-sm font-semibold text-slate-900 dark:text-white">
                  {formatRupiah(item.subtotal)}
                </p>
              </div>
              <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                {formatAngka(item.jumlah)} × {formatRupiah(item.harga)}
                {Number(item.diskon_persen) > 0
                  ? ` · Diskon ${formatAngka(item.diskon_persen)}%`
                  : ''}
              </p>
            </div>
          ))}
        </div>

        <div className="hidden overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 sm:block">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="bg-slate-50/80 text-xs uppercase tracking-wider text-slate-500 dark:bg-slate-800/40 dark:text-slate-400">
                <th scope="col" className="px-4 py-2.5 font-medium">
                  Produk
                </th>
                <th scope="col" className="px-4 py-2.5 text-right font-medium">
                  Harga
                </th>
                <th scope="col" className="px-4 py-2.5 text-right font-medium">
                  Jumlah
                </th>
                <th scope="col" className="px-4 py-2.5 text-right font-medium">
                  Diskon
                </th>
                <th scope="col" className="px-4 py-2.5 text-right font-medium">
                  Subtotal
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {transaksi.items.map((item) => (
                <tr key={item.id_detail}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800 dark:text-slate-100">
                      {item.nama_produk}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                      {item.nama_kategori}
                    </p>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-slate-600 dark:text-slate-300">
                    {formatRupiah(item.harga)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-slate-600 dark:text-slate-300">
                    {formatAngka(item.jumlah)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-slate-600 dark:text-slate-300">
                    {Number(item.diskon_persen) > 0
                      ? `${formatAngka(item.diskon_persen)}%`
                      : '—'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-slate-900 dark:text-white">
                    {formatRupiah(item.subtotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-slate-200 pt-4 dark:border-slate-800">
        <span className="text-sm text-slate-500 dark:text-slate-400">
          Total belanja
        </span>
        <span className="text-lg font-semibold text-slate-900 dark:text-white">
          {formatRupiah(transaksi.total_belanja)}
        </span>
      </div>
    </div>
  )
}

export default function Transaksi() {
  const [daftar, setDaftar] = useState([])
  const [memuat, setMemuat] = useState(true)
  const [galat, setGalat] = useState('')
  const [versi, setVersi] = useState(0)

  const [idDetail, setIdDetail] = useState(null)
  const [detail, setDetail] = useState(null)
  const [memuatDetail, setMemuatDetail] = useState(false)
  const [galatDetail, setGalatDetail] = useState('')
  const [versiDetail, setVersiDetail] = useState(0)

  const navigate = useNavigate()
  const lokasi = useLocation()

  useEffect(() => {
    let aktif = true

    setMemuat(true)
    setGalat('')

    ambilData('/api/transaksi.php')
      .then((hasil) => {
        if (!aktif) return
        setDaftar(Array.isArray(hasil) ? hasil : (hasil?.data ?? []))
      })
      .catch((error) => {
        if (!aktif) return
        setGalat(
          error instanceof Error
            ? error.message
            : 'Gagal memuat data transaksi.',
        )
      })
      .finally(() => {
        if (aktif) setMemuat(false)
      })

    return () => {
      aktif = false
    }
  }, [versi])

  useEffect(() => {
    if (idDetail === null) return undefined

    let aktif = true

    setMemuatDetail(true)
    setDetail(null)
    setGalatDetail('')

    ambilData(`/api/transaksi.php?id=${idDetail}`)
      .then((hasil) => {
        if (!aktif) return
        setDetail(hasil?.data ?? null)
      })
      .catch((error) => {
        if (!aktif) return
        setGalatDetail(
          error instanceof Error
            ? error.message
            : 'Gagal memuat detail transaksi.',
        )
      })
      .finally(() => {
        if (aktif) setMemuatDetail(false)
      })

    return () => {
      aktif = false
    }
  }, [idDetail, versiDetail])

  useEffect(() => {
    const id = new URLSearchParams(lokasi.search).get('detail')
    if (id) setIdDetail(id)
  }, [lokasi.search])

  function bukaDetail(id) {
    setIdDetail(id)
  }

  function tutupDetail() {
    setIdDetail(null)
    setDetail(null)
    setGalatDetail('')
    if (lokasi.search) navigate('/transaksi', { replace: true })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Penjualan"
        title="Transaksi"
        description="Catat dan tinjau transaksi penjualan toko."
        action={
          <Button onClick={() => navigate('/transaksi/baru')}>
            <Plus size={16} />
            Transaksi Baru
          </Button>
        }
      />

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-1 border-b border-slate-200/80 px-5 py-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              Riwayat Transaksi
            </h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Transaksi terbaru ditampilkan lebih dulu.
            </p>
          </div>
          <p
            aria-live="polite"
            className="text-xs font-medium text-slate-500 dark:text-slate-400"
          >
            {memuat
              ? 'Memuat data...'
              : galat
                ? 'Gagal memuat data'
                : `${formatAngka(daftar.length)} transaksi`}
          </p>
        </div>

        {memuat ? (
          <div
            aria-busy="true"
            aria-label="Memuat data transaksi"
            className="divide-y divide-slate-100 dark:divide-slate-800"
          >
            {[0, 1, 2, 3, 4].map((kunci) => (
              <div key={kunci} className="flex items-center gap-4 px-5 py-4">
                <Skeleton className="h-10 w-10 shrink-0 rounded-lg" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="hidden h-5 w-20 sm:block" />
                <Skeleton className="h-8 w-20" />
              </div>
            ))}
          </div>
        ) : galat ? (
          <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
              <TriangleAlert size={26} strokeWidth={1.8} />
            </span>
            <h3 className="mt-4 text-base font-semibold text-slate-900 dark:text-white">
              Gagal memuat data
            </h3>
            <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              {galat}
            </p>
            <Button
              variant="secondary"
              className="mt-5"
              onClick={() => setVersi((nilai) => nilai + 1)}
            >
              <RefreshCw size={15} />
              Coba Lagi
            </Button>
          </div>
        ) : daftar.length === 0 ? (
          <EmptyState
            icon={ShoppingCart}
            title="Belum ada transaksi"
            description="Mulai dengan mencatat transaksi penjualan pertama."
            action={
              <Button onClick={() => navigate('/transaksi/baru')}>
                <Plus size={16} />
                Transaksi Baru
              </Button>
            }
            className="py-14"
          />
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead>
                  <tr className="bg-slate-50/80 text-xs uppercase tracking-wider text-slate-500 dark:bg-slate-800/40 dark:text-slate-400">
                    <th scope="col" className="px-5 py-3 font-medium">
                      Transaksi
                    </th>
                    <th scope="col" className="px-5 py-3 font-medium">
                      Pelanggan
                    </th>
                    <th scope="col" className="px-5 py-3 font-medium">
                      Jumlah Item
                    </th>
                    <th
                      scope="col"
                      className="px-5 py-3 text-right font-medium"
                    >
                      Total Belanja
                    </th>
                    <th
                      scope="col"
                      className="px-5 py-3 text-right font-medium"
                    >
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {daftar.map((transaksi) => (
                    <tr
                      key={transaksi.id_transaksi}
                      className="transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/30"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
                            <ReceiptText size={17} strokeWidth={1.9} />
                          </span>
                          <div>
                            <p className="font-medium text-slate-800 dark:text-slate-100">
                              #{transaksi.id_transaksi}
                            </p>
                            <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                              <CalendarDays size={12} />
                              {formatTanggal(transaksi.tanggal)}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full bg-slate-100 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                            {inisial(transaksi.nama_pelanggan)}
                          </span>
                          <span className="text-slate-700 dark:text-slate-200">
                            {transaksi.nama_pelanggan}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge variant="slate">
                          {formatAngka(transaksi.jumlah_item)} item
                        </Badge>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-right font-semibold text-slate-900 dark:text-white">
                        {formatRupiah(transaksi.total_belanja)}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => bukaDetail(transaksi.id_transaksi)}
                          aria-label={`Lihat detail transaksi #${transaksi.id_transaksi}`}
                        >
                          <Eye size={15} />
                          Detail
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 md:hidden">
              {daftar.map((transaksi) => (
                <div key={transaksi.id_transaksi} className="px-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
                        <ReceiptText size={17} strokeWidth={1.9} />
                      </span>
                      <div className="min-w-0">
                        <p className="font-medium text-slate-800 dark:text-slate-100">
                          #{transaksi.id_transaksi} · {transaksi.nama_pelanggan}
                        </p>
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                          <CalendarDays size={12} />
                          {formatTanggal(transaksi.tanggal)}
                        </p>
                      </div>
                    </div>
                    <Badge variant="slate">
                      {formatAngka(transaksi.jumlah_item)} item
                    </Badge>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">
                      {formatRupiah(transaksi.total_belanja)}
                    </span>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => bukaDetail(transaksi.id_transaksi)}
                      aria-label={`Lihat detail transaksi #${transaksi.id_transaksi}`}
                    >
                      <Eye size={15} />
                      Detail
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-200/80 px-5 py-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
              Menampilkan {formatAngka(daftar.length)} transaksi
            </div>
          </>
        )}
      </Card>

      <Modal
        open={idDetail !== null}
        onClose={tutupDetail}
        title="Detail Transaksi"
        description={
          detail
            ? `Transaksi #${detail.id_transaksi} · ${formatTanggal(detail.tanggal)}`
            : 'Rincian barang pada transaksi yang dipilih.'
        }
        size="lg"
        footer={
          <Button variant="secondary" onClick={tutupDetail}>
            Tutup
          </Button>
        }
      >
        {memuatDetail ? (
          <div
            aria-busy="true"
            aria-label="Memuat detail transaksi"
            className="space-y-4"
          >
            <div className="grid grid-cols-1 gap-3 rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50 sm:grid-cols-3">
              {[0, 1, 2].map((kunci) => (
                <div key={kunci} className="space-y-2">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-4 w-28 max-w-full" />
                </div>
              ))}
            </div>
            <Skeleton className="h-4 w-32" />
            <div className="space-y-3 rounded-xl border border-slate-200 p-4 dark:border-slate-800">
              {[0, 1, 2].map((kunci) => (
                <div key={kunci} className="flex items-center justify-between gap-4">
                  <Skeleton className="h-4 w-40 max-w-full" />
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          </div>
        ) : galatDetail ? (
          <div className="flex flex-col items-center justify-center px-2 py-10 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
              <TriangleAlert size={24} strokeWidth={1.8} />
            </span>
            <p className="mt-3 text-sm font-semibold text-slate-900 dark:text-white">
              Gagal memuat detail
            </p>
            <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">
              {galatDetail}
            </p>
            <Button
              variant="secondary"
              className="mt-4"
              onClick={() => setVersiDetail((nilai) => nilai + 1)}
            >
              <RefreshCw size={15} />
              Coba Lagi
            </Button>
          </div>
        ) : detail ? (
          <div className="space-y-6">
            <DetailTransaksi transaksi={detail} />
            <div className="border-t border-slate-200 pt-5 dark:border-slate-800">
              <h3 className="mb-3 text-sm font-semibold text-slate-800 dark:text-slate-100">
                Cetak ulang struk
              </h3>
              <Struk transaksi={detail} tampilkanTombolCetak />
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-500 dark:text-slate-400">
            <Loader2 size={16} className="animate-spin" />
            Memuat detail...
          </div>
        )}
      </Modal>
    </div>
  )
}
