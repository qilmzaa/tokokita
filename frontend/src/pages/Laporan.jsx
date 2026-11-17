import {
  BarChart3,
  Download,
  Filter,
  Printer,
  RefreshCw,
  RotateCcw,
  Rows3,
  TrendingUp,
  TriangleAlert,
  Users,
  Wallet,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import Badge from '../components/Badge'
import Button from '../components/Button'
import Card from '../components/Card'
import EmptyState from '../components/EmptyState'
import PageHeader from '../components/PageHeader'
import Skeleton from '../components/Skeleton'
import { useToast } from '../components/Toast'
import { ambilData } from '../lib/api'
import {
  formatAngka,
  formatRupiah,
  formatRupiahRingkas,
  formatTanggal,
} from '../lib/format'
import { useTheme } from '../lib/theme'

const KELAS_INPUT =
  'h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 dark:disabled:bg-slate-900 dark:disabled:text-slate-500 dark:focus:border-indigo-400'

const KELAS_LABEL =
  'mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-300'

const WARNA_KATEGORI = {
  Gold: '#f59e0b',
  Silver: '#94a3b8',
  Reguler: '#6366f1',
}

const GAYA_IKON = {
  indigo:
    'bg-indigo-50 text-indigo-600 ring-indigo-200/70 dark:bg-indigo-500/10 dark:text-indigo-300 dark:ring-indigo-500/20',
  emerald:
    'bg-emerald-50 text-emerald-600 ring-emerald-200/70 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20',
}

const FILTER_KOSONG = { dari: '', sampai: '', kota: '' }

function kategoriBelanja(total) {
  const nilai = Number(total) || 0

  if (nilai >= 1_000_000) return { label: 'Gold', variant: 'amber' }
  if (nilai >= 500_000) return { label: 'Silver', variant: 'slate' }

  return { label: 'Reguler', variant: 'indigo' }
}

function inisial(nama = '') {
  const bagian = String(nama).trim().split(/\s+/).filter(Boolean).slice(0, 2)

  if (!bagian.length) return '?'

  return bagian.map((kata) => kata[0]).join('').toUpperCase()
}

function teksPeriode(filter) {
  if (filter.dari && filter.sampai) {
    return `${formatTanggal(filter.dari)} – ${formatTanggal(filter.sampai)}`
  }
  if (filter.dari) return `Sejak ${formatTanggal(filter.dari)}`
  if (filter.sampai) return `Sampai ${formatTanggal(filter.sampai)}`

  return 'Semua periode'
}

function unduhCsv(namaBerkas, baris) {
  const isi = baris
    .map((sel) =>
      sel
        .map((nilai) => {
          const teks = String(nilai ?? '')
          return /[";\n\r]/.test(teks)
            ? `"${teks.replace(/"/g, '""')}"`
            : teks
        })
        .join(';'),
    )
    .join('\r\n')

  const blob = new Blob([`\uFEFF${isi}`], {
    type: 'text/csv;charset=utf-8;',
  })
  const url = URL.createObjectURL(blob)
  const tautan = document.createElement('a')

  tautan.href = url
  tautan.download = namaBerkas
  document.body.appendChild(tautan)
  tautan.click()
  document.body.removeChild(tautan)
  URL.revokeObjectURL(url)
}

function KartuRingkasan({ label, nilai, keterangan, ikon: Ikon, tone }) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            {label}
          </p>
          <p className="mt-2 break-words text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
            {nilai}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
            {keterangan}
          </p>
        </div>
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset ${GAYA_IKON[tone]}`}
        >
          <Ikon size={19} strokeWidth={2} />
        </span>
      </div>
    </Card>
  )
}

function KartuGagal({ pesan, onCobaLagi }) {
  return (
    <Card className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
        <TriangleAlert size={26} strokeWidth={1.8} />
      </span>
      <h2 className="mt-4 text-base font-semibold text-slate-900 dark:text-white">
        Gagal memuat laporan
      </h2>
      <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-slate-500 dark:text-slate-400">
        {pesan}
      </p>
      <Button variant="secondary" className="mt-5" onClick={onCobaLagi}>
        <RefreshCw size={15} />
        Coba Lagi
      </Button>
    </Card>
  )
}

function TooltipPelanggan({ active, payload }) {
  if (!active || !payload?.length) return null

  const pelanggan = payload[0].payload
  const kategori = kategoriBelanja(pelanggan.total_belanja)

  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 shadow-lg shadow-slate-900/10 dark:border-slate-700 dark:bg-slate-900 dark:shadow-black/40">
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
        {pelanggan.nama_pelanggan}
      </p>
      <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
        {formatRupiah(pelanggan.total_belanja)}
      </p>
      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
        {formatAngka(pelanggan.total_transaksi)} transaksi · {kategori.label}
      </p>
    </div>
  )
}

function PanelPenjualan() {
  const [draf, setDraf] = useState(FILTER_KOSONG)
  const [terapan, setTerapan] = useState(FILTER_KOSONG)
  const [galatFilter, setGalatFilter] = useState('')

  const [data, setData] = useState([])
  const [ringkasan, setRingkasan] = useState({
    jumlah_baris: 0,
    jumlah_transaksi: 0,
    total_penjualan: 0,
  })
  const [daftarKota, setDaftarKota] = useState([])
  const [memuat, setMemuat] = useState(true)
  const [galat, setGalat] = useState('')
  const [versi, setVersi] = useState(0)

  const { sukses } = useToast()

  useEffect(() => {
    let aktif = true
    const parameter = new URLSearchParams()

    if (terapan.dari) parameter.set('dari', terapan.dari)
    if (terapan.sampai) parameter.set('sampai', terapan.sampai)
    if (terapan.kota) parameter.set('kota', terapan.kota)

    const kueri = parameter.toString()

    setMemuat(true)
    setGalat('')

    ambilData(`/api/laporan_penjualan.php${kueri ? `?${kueri}` : ''}`)
      .then((hasil) => {
        if (!aktif) return

        setData(Array.isArray(hasil?.data) ? hasil.data : [])
        setRingkasan({
          jumlah_baris: Number(hasil?.ringkasan?.jumlah_baris) || 0,
          jumlah_transaksi: Number(hasil?.ringkasan?.jumlah_transaksi) || 0,
          total_penjualan: Number(hasil?.ringkasan?.total_penjualan) || 0,
        })

        if (Array.isArray(hasil?.kota)) setDaftarKota(hasil.kota)
      })
      .catch((error) => {
        if (!aktif) return
        setGalat(
          error instanceof Error
            ? error.message
            : 'Gagal memuat laporan penjualan.',
        )
      })
      .finally(() => {
        if (aktif) setMemuat(false)
      })

    return () => {
      aktif = false
    }
  }, [terapan, versi])

  function ubahDraf(kolom, nilai) {
    setGalatFilter('')
    setDraf((sebelumnya) => ({ ...sebelumnya, [kolom]: nilai }))
  }

  function terapkanFilter(event) {
    event.preventDefault()

    if (draf.dari && draf.sampai && draf.dari > draf.sampai) {
      setGalatFilter('Tanggal awal tidak boleh melebihi tanggal akhir.')
      return
    }

    setGalatFilter('')
    setTerapan({ ...draf })
  }

  function aturUlangFilter() {
    setGalatFilter('')
    setDraf(FILTER_KOSONG)
    setTerapan({ ...FILTER_KOSONG })
  }

  function eksporCsv() {
    if (!data.length) return

    const baris = [
      [
        'Tanggal',
        'ID Transaksi',
        'Pelanggan',
        'Kota',
        'Kategori',
        'Produk',
        'Jumlah',
        'Harga',
        'Diskon (%)',
        'Subtotal',
      ],
      ...data.map((item) => [
        item.tanggal,
        item.id_transaksi,
        item.nama_pelanggan,
        item.kota,
        item.nama_kategori,
        item.nama_produk,
        item.jumlah,
        item.harga,
        item.diskon_persen,
        item.subtotal,
      ]),
    ]

    const awal = terapan.dari || 'awal'
    const akhir = terapan.sampai || 'akhir'

    unduhCsv(`laporan-penjualan-${awal}-${akhir}.csv`, baris)
    sukses('Laporan penjualan diekspor ke CSV.')
  }

  return (
    <div className="space-y-6">
      <Card className="cetak-sembunyi p-4 sm:p-5">
        <form onSubmit={terapkanFilter}>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-12 xl:items-end">
            <div className="xl:col-span-3">
              <label htmlFor="laporan-dari" className={KELAS_LABEL}>
                Tanggal awal
              </label>
              <input
                id="laporan-dari"
                type="date"
                value={draf.dari}
                onChange={(event) => ubahDraf('dari', event.target.value)}
                className={KELAS_INPUT}
              />
            </div>

            <div className="xl:col-span-3">
              <label htmlFor="laporan-sampai" className={KELAS_LABEL}>
                Tanggal akhir
              </label>
              <input
                id="laporan-sampai"
                type="date"
                value={draf.sampai}
                onChange={(event) => ubahDraf('sampai', event.target.value)}
                className={KELAS_INPUT}
              />
            </div>

            <div className="xl:col-span-3">
              <label htmlFor="laporan-kota" className={KELAS_LABEL}>
                Kota
              </label>
              <select
                id="laporan-kota"
                value={draf.kota}
                onChange={(event) => ubahDraf('kota', event.target.value)}
                className={KELAS_INPUT}
              >
                <option value="">Semua kota</option>
                {daftarKota.map((kota) => (
                  <option key={kota} value={kota}>
                    {kota}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2 sm:col-span-2 xl:col-span-3">
              <Button type="submit" className="flex-1">
                <Filter size={16} />
                Terapkan
              </Button>
              <Button variant="secondary" onClick={aturUlangFilter}>
                <RotateCcw size={16} />
                Atur Ulang
              </Button>
            </div>
          </div>

          {galatFilter && (
            <p
              role="alert"
              className="mt-3 flex items-start gap-2 text-sm text-rose-600 dark:text-rose-400"
            >
              <TriangleAlert size={16} className="mt-0.5 shrink-0" />
              {galatFilter}
            </p>
          )}
        </form>
      </Card>

      {galat ? (
        <KartuGagal
          pesan={galat}
          onCobaLagi={() => setVersi((nilai) => nilai + 1)}
        />
      ) : (
        <>
          {!memuat && (
            <div className="hidden print:block">
              <div className="flex items-start justify-between gap-6 border-b-2 border-slate-800 pb-3">
                <div>
                  <p className="text-lg font-bold text-slate-900">TokoKita</p>
                  <p className="text-xs text-slate-600">
                    Sistem Informasi Penjualan · XII RPL 1
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-900">
                    Laporan Penjualan
                  </p>
                  <p className="text-xs text-slate-600">
                    {teksPeriode(terapan)}
                  </p>
                  {terapan.kota && (
                    <p className="text-xs text-slate-600">
                      Kota: {terapan.kota}
                    </p>
                  )}
                </div>
              </div>
              <p className="mt-2 text-xs text-slate-600">
                {formatAngka(ringkasan.jumlah_baris)} baris ·{' '}
                {formatAngka(ringkasan.jumlah_transaksi)} transaksi · Total{' '}
                {formatRupiah(ringkasan.total_penjualan)}
              </p>
            </div>
          )}

          {memuat ? (
            <div
              aria-busy="true"
              aria-label="Memuat ringkasan penjualan"
              className="grid gap-4 sm:grid-cols-2"
            >
              {[0, 1].map((kunci) => (
                <Card key={kunci} className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-2">
                      <Skeleton className="h-3.5 w-24" />
                      <Skeleton className="h-7 w-32" />
                      <Skeleton className="h-3 w-40 max-w-full" />
                    </div>
                    <Skeleton className="h-10 w-10 rounded-xl" />
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <KartuRingkasan
                label="Jumlah Baris"
                nilai={formatAngka(ringkasan.jumlah_baris)}
                keterangan={`${formatAngka(ringkasan.jumlah_transaksi)} transaksi tercatat`}
                ikon={Rows3}
                tone="indigo"
              />
              <KartuRingkasan
                label="Total Penjualan"
                nilai={formatRupiah(ringkasan.total_penjualan)}
                keterangan="Akumulasi subtotal setelah diskon"
                ikon={Wallet}
                tone="emerald"
              />
            </div>
          )}

          <Card className="overflow-hidden">
            <div className="cetak-sembunyi flex flex-col gap-3 border-b border-slate-200/80 px-5 py-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                  Rincian Penjualan
                </h2>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  {teksPeriode(terapan)}
                  {terapan.kota ? ` · ${terapan.kota}` : ''}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => window.print()}
                  disabled={memuat || data.length === 0}
                >
                  <Printer size={15} />
                  Cetak
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={eksporCsv}
                  disabled={memuat || data.length === 0}
                >
                  <Download size={15} />
                  Ekspor CSV
                </Button>
              </div>
            </div>

            {memuat ? (
              <div
                aria-busy="true"
                aria-label="Memuat data laporan penjualan"
                className="divide-y divide-slate-100 dark:divide-slate-800"
              >
                {[0, 1, 2, 3, 4, 5].map((kunci) => (
                  <div
                    key={kunci}
                    className="flex items-center gap-4 px-5 py-4"
                  >
                    <Skeleton className="h-4 w-24 shrink-0" />
                    <Skeleton className="hidden h-4 w-20 sm:block" />
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="hidden h-4 w-36 lg:block" />
                    <Skeleton className="ml-auto h-4 w-24 shrink-0" />
                  </div>
                ))}
              </div>
            ) : data.length === 0 ? (
              <EmptyState
                icon={BarChart3}
                title="Tidak ada data penjualan"
                description="Belum ada transaksi yang cocok dengan filter yang dipilih."
                className="py-14"
              />
            ) : (
              <>
                <div className="cetak-tabel hidden overflow-x-auto md:block">
                  <table className="w-full min-w-[880px] text-left text-sm">
                    <thead>
                      <tr className="bg-slate-50/80 text-xs uppercase tracking-wider text-slate-500 dark:bg-slate-800/40 dark:text-slate-400">
                        <th scope="col" className="px-5 py-3 font-medium">
                          Tanggal
                        </th>
                        <th scope="col" className="px-5 py-3 font-medium">
                          Transaksi
                        </th>
                        <th scope="col" className="px-5 py-3 font-medium">
                          Pelanggan
                        </th>
                        <th scope="col" className="px-5 py-3 font-medium">
                          Produk
                        </th>
                        <th
                          scope="col"
                          className="px-5 py-3 text-right font-medium"
                        >
                          Jumlah
                        </th>
                        <th
                          scope="col"
                          className="px-5 py-3 text-right font-medium"
                        >
                          Harga
                        </th>
                        <th
                          scope="col"
                          className="px-5 py-3 text-right font-medium"
                        >
                          Diskon
                        </th>
                        <th
                          scope="col"
                          className="px-5 py-3 text-right font-medium"
                        >
                          Subtotal
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {data.map((item, index) => (
                        <tr
                          key={`${item.id_transaksi}-${index}`}
                          className="transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/30"
                        >
                          <td className="whitespace-nowrap px-5 py-3.5 text-slate-600 dark:text-slate-300">
                            {formatTanggal(item.tanggal)}
                          </td>
                          <td className="whitespace-nowrap px-5 py-3.5 font-medium text-slate-800 dark:text-slate-100">
                            #{item.id_transaksi}
                          </td>
                          <td className="whitespace-nowrap px-5 py-3.5">
                            <p className="text-slate-700 dark:text-slate-200">
                              {item.nama_pelanggan}
                            </p>
                            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                              {item.kota}
                            </p>
                          </td>
                          <td className="px-5 py-3.5">
                            <p className="text-slate-700 dark:text-slate-200">
                              {item.nama_produk}
                            </p>
                            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                              {item.nama_kategori}
                            </p>
                          </td>
                          <td className="whitespace-nowrap px-5 py-3.5 text-right text-slate-600 dark:text-slate-300">
                            {formatAngka(item.jumlah)}
                          </td>
                          <td className="whitespace-nowrap px-5 py-3.5 text-right text-slate-600 dark:text-slate-300">
                            {formatRupiah(item.harga)}
                          </td>
                          <td className="whitespace-nowrap px-5 py-3.5 text-right text-slate-600 dark:text-slate-300">
                            {Number(item.diskon_persen) > 0
                              ? `${formatAngka(item.diskon_persen)}%`
                              : '—'}
                          </td>
                          <td className="whitespace-nowrap px-5 py-3.5 text-right font-semibold text-slate-900 dark:text-white">
                            {formatRupiah(item.subtotal)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-slate-200 dark:border-slate-800">
                        <td
                          colSpan={7}
                          className="px-5 py-3.5 text-right text-sm font-medium text-slate-600 dark:text-slate-300"
                        >
                          Total Penjualan
                        </td>
                        <td className="whitespace-nowrap px-5 py-3.5 text-right text-sm font-semibold text-slate-900 dark:text-white">
                          {formatRupiah(ringkasan.total_penjualan)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                <div className="cetak-kartu divide-y divide-slate-100 dark:divide-slate-800 md:hidden">
                  {data.map((item, index) => (
                    <div
                      key={`${item.id_transaksi}-${index}`}
                      className="px-4 py-3.5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                            {item.nama_produk}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                            {item.nama_kategori} ·{' '}
                            {formatAngka(item.jumlah)} ×{' '}
                            {formatRupiah(item.harga)}
                          </p>
                        </div>
                        <p className="shrink-0 text-sm font-semibold text-slate-900 dark:text-white">
                          {formatRupiah(item.subtotal)}
                        </p>
                      </div>
                      <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                        {formatTanggal(item.tanggal)} · #{item.id_transaksi} ·{' '}
                        {item.nama_pelanggan} ({item.kota})
                        {Number(item.diskon_persen) > 0
                          ? ` · Diskon ${formatAngka(item.diskon_persen)}%`
                          : ''}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="cetak-sembunyi border-t border-slate-200/80 px-5 py-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
                  Menampilkan {formatAngka(data.length)} baris ·{' '}
                  {formatAngka(ringkasan.jumlah_transaksi)} transaksi
                </div>
              </>
            )}
          </Card>
        </>
      )}
    </div>
  )
}

function PanelPelanggan() {
  const [data, setData] = useState([])
  const [memuat, setMemuat] = useState(true)
  const [galat, setGalat] = useState('')
  const [versi, setVersi] = useState(0)

  const { gelap } = useTheme()

  useEffect(() => {
    let aktif = true

    setMemuat(true)
    setGalat('')

    ambilData('/api/laporan_pelanggan.php')
      .then((hasil) => {
        if (!aktif) return
        setData(Array.isArray(hasil?.data) ? hasil.data : [])
      })
      .catch((error) => {
        if (!aktif) return
        setGalat(
          error instanceof Error
            ? error.message
            : 'Gagal memuat laporan pelanggan.',
        )
      })
      .finally(() => {
        if (aktif) setMemuat(false)
      })

    return () => {
      aktif = false
    }
  }, [versi])

  const warnaGrid = gelap ? '#1e293b' : '#e2e8f0'
  const warnaTeks = gelap ? '#94a3b8' : '#64748b'
  const tinggiGrafik = Math.max(240, data.length * 42 + 48)

  if (memuat) {
    return (
      <div className="space-y-6">
        <Card className="overflow-hidden">
          <div className="border-b border-slate-200/80 px-5 py-4 dark:border-slate-800">
            <Skeleton className="h-5 w-52" />
            <Skeleton className="mt-2 h-3 w-64 max-w-full" />
          </div>
          <div className="p-5">
            <Skeleton className="h-[280px] w-full rounded-lg" />
          </div>
        </Card>
        <Card className="overflow-hidden">
          <div className="border-b border-slate-200/80 px-5 py-4 dark:border-slate-800">
            <Skeleton className="h-5 w-44" />
            <Skeleton className="mt-2 h-3 w-56 max-w-full" />
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {[0, 1, 2, 3, 4].map((kunci) => (
              <div key={kunci} className="flex items-center gap-4 px-5 py-4">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="ml-auto h-4 w-24" />
                <Skeleton className="hidden h-5 w-16 sm:block" />
              </div>
            ))}
          </div>
        </Card>
      </div>
    )
  }

  if (galat) {
    return (
      <KartuGagal
        pesan={galat}
        onCobaLagi={() => setVersi((nilai) => nilai + 1)}
      />
    )
  }

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-200/80 px-5 py-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              Total Belanja per Pelanggan
            </h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Diurutkan dari belanja terbesar.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
            {['Gold', 'Silver', 'Reguler'].map((label) => (
              <span key={label} className="inline-flex items-center gap-1.5">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: WARNA_KATEGORI[label] }}
                />
                {label}
              </span>
            ))}
          </div>
        </div>

        <div className="px-2 pb-4 pt-5 sm:px-4">
          {data.length ? (
            <div style={{ height: tinggiGrafik }} className="w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data}
                  layout="vertical"
                  margin={{ top: 4, right: 24, bottom: 4, left: 8 }}
                  barCategoryGap={10}
                >
                  <CartesianGrid
                    strokeDasharray="3 4"
                    horizontal={false}
                    stroke={warnaGrid}
                  />
                  <XAxis
                    type="number"
                    tickFormatter={formatRupiahRingkas}
                    tick={{ fill: warnaTeks, fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="nama_pelanggan"
                    width={92}
                    tickFormatter={(nilai) =>
                      String(nilai).length > 13
                        ? `${String(nilai).slice(0, 12)}…`
                        : nilai
                    }
                    tick={{ fill: warnaTeks, fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    content={<TooltipPelanggan />}
                    cursor={{
                      fill: gelap
                        ? 'rgba(148, 163, 184, 0.08)'
                        : 'rgba(100, 116, 139, 0.06)',
                    }}
                  />
                  <Bar
                    dataKey="total_belanja"
                    name="Total Belanja"
                    isAnimationActive={false}
                    maxBarSize={26}
                    radius={[0, 6, 6, 0]}
                  >
                    {data.map((pelanggan) => (
                      <Cell
                        key={pelanggan.id_pelanggan}
                        fill={
                          WARNA_KATEGORI[
                            kategoriBelanja(pelanggan.total_belanja).label
                          ]
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState
              icon={BarChart3}
              title="Belum ada data belanja"
              description="Grafik akan tampil setelah ada pelanggan dengan transaksi."
              className="h-[240px]"
            />
          )}
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-2 border-b border-slate-200/80 px-5 py-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              Rekap Belanja Pelanggan
            </h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Gold ≥ Rp 1.000.000 · Silver ≥ Rp 500.000 · sisanya Reguler.
            </p>
          </div>
          <Badge variant="indigo" className="self-start sm:self-center">
            {formatAngka(data.length)} pelanggan
          </Badge>
        </div>

        {data.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Belum ada pelanggan"
            description="Data pelanggan akan tampil setelah ditambahkan."
            className="py-14"
          />
        ) : (
          <>
            <div className="cetak-tabel hidden overflow-x-auto md:block">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead>
                  <tr className="bg-slate-50/80 text-xs uppercase tracking-wider text-slate-500 dark:bg-slate-800/40 dark:text-slate-400">
                    <th scope="col" className="px-5 py-3 font-medium">
                      Pelanggan
                    </th>
                    <th
                      scope="col"
                      className="px-5 py-3 text-right font-medium"
                    >
                      Total Transaksi
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
                      Kategori
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {data.map((pelanggan) => {
                    const kategori = kategoriBelanja(
                      pelanggan.total_belanja,
                    )

                    return (
                      <tr
                        key={pelanggan.id_pelanggan}
                        className="transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/30"
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <span className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full bg-slate-100 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                              {inisial(pelanggan.nama_pelanggan)}
                            </span>
                            <span className="text-slate-700 dark:text-slate-200">
                              {pelanggan.nama_pelanggan}
                            </span>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-5 py-3.5 text-right text-slate-600 dark:text-slate-300">
                          {formatAngka(pelanggan.total_transaksi)}
                        </td>
                        <td className="whitespace-nowrap px-5 py-3.5 text-right font-semibold text-slate-900 dark:text-white">
                          {formatRupiah(pelanggan.total_belanja)}
                        </td>
                        <td className="whitespace-nowrap px-5 py-3.5 text-right">
                          <Badge variant={kategori.variant}>
                            {kategori.label}
                          </Badge>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="cetak-kartu divide-y divide-slate-100 dark:divide-slate-800 md:hidden">
              {data.map((pelanggan) => {
                const kategori = kategoriBelanja(pelanggan.total_belanja)

                return (
                  <div
                    key={pelanggan.id_pelanggan}
                    className="flex items-center justify-between gap-3 px-4 py-3.5"
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full bg-slate-100 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        {inisial(pelanggan.nama_pelanggan)}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">
                          {pelanggan.nama_pelanggan}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                          {formatAngka(pelanggan.total_transaksi)} transaksi
                        </p>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        {formatRupiah(pelanggan.total_belanja)}
                      </p>
                      <Badge
                        variant={kategori.variant}
                        className="mt-1"
                      >
                        {kategori.label}
                      </Badge>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </Card>
    </div>
  )
}

export default function Laporan() {
  const [tab, setTab] = useState('penjualan')
  const { gelap } = useTheme()

  // Saat mencetak, paksa tampilan terang agar hasil cetak bersih.
  useEffect(() => {
    const akar = document.documentElement

    const sebelumCetak = () => {
      akar.classList.remove('dark')
      akar.style.colorScheme = 'light'
    }

    const setelahCetak = () => {
      if (!gelap) return
      akar.classList.add('dark')
      akar.style.colorScheme = 'dark'
    }

    window.addEventListener('beforeprint', sebelumCetak)
    window.addEventListener('afterprint', setelahCetak)

    return () => {
      window.removeEventListener('beforeprint', sebelumCetak)
      window.removeEventListener('afterprint', setelahCetak)
      setelahCetak()
    }
  }, [gelap])

  const tombolTab = [
    { nilai: 'penjualan', label: 'Penjualan', ikon: TrendingUp },
    { nilai: 'pelanggan', label: 'Pelanggan', ikon: Users },
  ]

  return (
    <div className="cetak-area space-y-6">
      <div className="cetak-sembunyi">
        <PageHeader
          eyebrow="Analitik"
          title="Laporan"
          description="Tinjau laporan penjualan dan rekap belanja pelanggan."
        />
      </div>

      <div
        role="tablist"
        aria-label="Jenis laporan"
        className="cetak-sembunyi inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm dark:border-slate-800 dark:bg-slate-900"
      >
        {tombolTab.map(({ nilai, label, ikon: Ikon }) => {
          const aktif = tab === nilai

          return (
            <button
              key={nilai}
              type="button"
              role="tab"
              aria-selected={aktif}
              onClick={() => setTab(nilai)}
              className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
                aktif
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
              }`}
            >
              <Ikon size={16} />
              {label}
            </button>
          )
        })}
      </div>

      <div
        role="tabpanel"
        aria-label={tab === 'penjualan' ? 'Laporan penjualan' : 'Laporan pelanggan'}
      >
        {tab === 'penjualan' ? <PanelPenjualan /> : <PanelPelanggan />}
      </div>
    </div>
  )
}
