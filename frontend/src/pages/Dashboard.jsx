import {
  AlertTriangle,
  BarChart3,
  CalendarDays,
  Package,
  RefreshCw,
  ShoppingCart,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
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
  formatTanggalPendek,
} from '../lib/format'
import { useTheme } from '../lib/theme'

const gayaIkon = {
  indigo:
    'bg-indigo-50 text-indigo-600 ring-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-300 dark:ring-indigo-500/20',
  sky: 'bg-sky-50 text-sky-600 ring-sky-100 dark:bg-sky-500/10 dark:text-sky-300 dark:ring-sky-500/20',
  amber:
    'bg-amber-50 text-amber-600 ring-amber-100 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/20',
  emerald:
    'bg-emerald-50 text-emerald-600 ring-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20',
}

function inisial(nama = '') {
  const bagian = nama.trim().split(/\s+/).filter(Boolean).slice(0, 2)
  if (!bagian.length) return '?'
  return bagian.map((kata) => kata[0]).join('').toUpperCase()
}

function KartuStatistik({ label, nilai, keterangan, ikon: Ikon, tone }) {
  return (
    <Card className="p-5 transition-shadow duration-200 hover:shadow-md hover:shadow-slate-900/[0.06] dark:hover:shadow-black/30">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
          {label}
        </p>
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset ${gayaIkon[tone]}`}
        >
          <Ikon size={19} strokeWidth={2} />
        </span>
      </div>
      <p className="mt-3 break-words text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
        {nilai}
      </p>
      <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
        {keterangan}
      </p>
    </Card>
  )
}

function TooltipPenjualan({ active, payload, label }) {
  if (!active || !payload?.length) return null

  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 shadow-lg shadow-slate-900/10 dark:border-slate-700 dark:bg-slate-900 dark:shadow-black/40">
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
        {formatTanggal(label)}
      </p>
      <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
        {formatRupiah(payload[0].value)}
      </p>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div
      className="space-y-6"
      aria-busy="true"
      aria-label="Memuat data dashboard"
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((kunci) => (
          <Card key={kunci} className="p-5">
            <div className="flex items-start justify-between gap-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-10 rounded-xl" />
            </div>
            <Skeleton className="mt-4 h-8 w-32" />
            <Skeleton className="mt-2 h-3 w-28" />
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden">
        <div className="border-b border-slate-200/80 px-5 py-5 dark:border-slate-800">
          <Skeleton className="h-5 w-44" />
          <Skeleton className="mt-2 h-3 w-60" />
        </div>
        <div className="p-5">
          <Skeleton className="h-[280px] w-full rounded-lg" />
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="border-b border-slate-200/80 px-5 py-5 dark:border-slate-800">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="mt-2 h-3 w-56" />
        </div>
        <div className="space-y-4 p-5">
          {[0, 1, 2, 3, 4].map((kunci) => (
            <div key={kunci} className="flex items-center gap-4">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="ml-auto h-4 w-24" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

function GagalMemuat({ pesan, onCobaLagi }) {
  return (
    <Card className="border-rose-200 bg-rose-50/70 p-5 dark:border-rose-500/20 dark:bg-rose-500/[0.06] sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600 ring-1 ring-inset ring-rose-200/70 dark:bg-rose-500/10 dark:text-rose-400 dark:ring-rose-500/20">
          <AlertTriangle size={21} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            Gagal memuat data
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            {pesan}
          </p>
        </div>
        <Button variant="secondary" onClick={onCobaLagi}>
          <RefreshCw size={15} />
          Coba Lagi
        </Button>
      </div>
    </Card>
  )
}

function TataLetakDashboard({ data, gelap }) {
  const daftarTransaksi = data.transaksi_terbaru ?? []
  const dataGrafik = data.penjualan_per_tanggal ?? []
  const warnaGrid = gelap ? '#1e293b' : '#e2e8f0'
  const warnaTeks = gelap ? '#94a3b8' : '#64748b'

  const kartu = [
    {
      label: 'Total Pelanggan',
      nilai: formatAngka(data.jumlah_pelanggan),
      keterangan: 'Pelanggan terdaftar',
      ikon: Users,
      tone: 'indigo',
    },
    {
      label: 'Total Produk',
      nilai: formatAngka(data.jumlah_produk),
      keterangan: 'Produk dalam katalog',
      ikon: Package,
      tone: 'sky',
    },
    {
      label: 'Total Transaksi',
      nilai: formatAngka(data.jumlah_transaksi),
      keterangan: 'Transaksi tercatat',
      ikon: ShoppingCart,
      tone: 'amber',
    },
    {
      label: 'Total Penjualan',
      nilai: formatRupiah(data.total_penjualan),
      keterangan: 'Akumulasi seluruh transaksi',
      ikon: Wallet,
      tone: 'emerald',
    },
  ]

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kartu.map((item) => (
          <KartuStatistik key={item.label} {...item} />
        ))}
      </div>

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-200/80 px-5 py-5 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              Penjualan per Tanggal
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Total nilai transaksi harian yang tercatat.
            </p>
          </div>
          <Badge variant="indigo" className="self-start sm:self-center">
            <TrendingUp size={12} />
            {formatAngka(dataGrafik.length)} hari transaksi
          </Badge>
        </div>

        <div className="px-2 pb-4 pt-5 sm:px-4">
          {dataGrafik.length ? (
            <div className="h-[300px] w-full sm:h-[340px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={dataGrafik}
                  margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="gradienPenjualan"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="#6366f1"
                        stopOpacity={0.28}
                      />
                      <stop
                        offset="95%"
                        stopColor="#6366f1"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 4"
                    vertical={false}
                    stroke={warnaGrid}
                  />
                  <XAxis
                    dataKey="tanggal"
                    tickFormatter={formatTanggalPendek}
                    tick={{ fill: warnaTeks, fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    dy={10}
                    minTickGap={18}
                  />
                  <YAxis
                    tickFormatter={formatRupiahRingkas}
                    tick={{ fill: warnaTeks, fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    width={62}
                    tickMargin={4}
                  />
                  <Tooltip
                    content={<TooltipPenjualan />}
                    cursor={{
                      stroke: '#818cf8',
                      strokeWidth: 1,
                      strokeDasharray: '4 4',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="total"
                    name="Penjualan"
                    stroke="#6366f1"
                    strokeWidth={2.5}
                    fill="url(#gradienPenjualan)"
                    dot={false}
                    isAnimationActive={false}
                    activeDot={{
                      r: 5,
                      strokeWidth: 2,
                      stroke: gelap ? '#0f172a' : '#ffffff',
                      fill: '#6366f1',
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState
              icon={BarChart3}
              title="Belum ada data penjualan"
              description="Grafik akan tampil setelah ada transaksi yang tercatat."
              className="h-[300px]"
            />
          )}
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-2 border-b border-slate-200/80 px-5 py-5 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              Transaksi Terbaru
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Lima transaksi terakhir yang masuk.
            </p>
          </div>
          <Badge variant="slate" className="self-start sm:self-center">
            <CalendarDays size={12} />5 terbaru
          </Badge>
        </div>

        {daftarTransaksi.length ? (
          <>
            <div className="divide-y divide-slate-100 dark:divide-slate-800 sm:hidden">
              {daftarTransaksi.map((transaksi) => (
                <div
                  key={transaksi.id_transaksi}
                  className="flex items-center gap-3 px-4 py-3.5"
                >
                  <span className="flex h-9 w-9 shrink-0 select-none items-center justify-center rounded-full bg-indigo-50 text-[11px] font-semibold text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
                    {inisial(transaksi.nama_pelanggan)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">
                        {transaksi.nama_pelanggan}
                      </p>
                      <Badge variant="indigo">
                        #{transaksi.id_transaksi}
                      </Badge>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                      {formatTanggal(transaksi.tanggal)}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-semibold text-slate-900 dark:text-white">
                    {formatRupiah(transaksi.total_belanja)}
                  </p>
                </div>
              ))}
            </div>

            <div className="hidden overflow-x-auto sm:block">
              <table className="w-full min-w-[600px] text-left text-sm">
                <thead>
                  <tr className="bg-slate-50/80 text-xs uppercase tracking-wider text-slate-500 dark:bg-slate-800/40 dark:text-slate-400">
                    <th
                      scope="col"
                      className="px-5 py-3 font-medium"
                    >
                      ID Transaksi
                    </th>
                    <th scope="col" className="px-5 py-3 font-medium">
                      Tanggal
                    </th>
                    <th scope="col" className="px-5 py-3 font-medium">
                      Pelanggan
                    </th>
                    <th
                      scope="col"
                      className="px-5 py-3 text-right font-medium"
                    >
                      Total Belanja
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {daftarTransaksi.map((transaksi) => (
                    <tr
                      key={transaksi.id_transaksi}
                      className="transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/30"
                    >
                      <td className="px-5 py-3.5">
                        <Badge variant="indigo">
                          #{transaksi.id_transaksi}
                        </Badge>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-slate-600 dark:text-slate-300">
                        {formatTanggal(transaksi.tanggal)}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full bg-indigo-50 text-[11px] font-semibold text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
                            {inisial(transaksi.nama_pelanggan)}
                          </span>
                          <span className="whitespace-nowrap font-medium text-slate-800 dark:text-slate-100">
                            {transaksi.nama_pelanggan}
                          </span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-right font-semibold text-slate-900 dark:text-white">
                        {formatRupiah(transaksi.total_belanja)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200/80 px-5 py-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
              <span>
                Menampilkan {formatAngka(daftarTransaksi.length)} dari{' '}
                {formatAngka(data.jumlah_transaksi)} transaksi
              </span>
              <span className="hidden sm:inline">
                Diurutkan dari transaksi terbaru
              </span>
            </div>
          </>
        ) : (
          <EmptyState
            icon={ShoppingCart}
            title="Belum ada transaksi"
            description="Transaksi terbaru akan muncul di sini setelah penjualan dicatat."
          />
        )}
      </Card>
    </div>
  )
}

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [memuat, setMemuat] = useState(true)
  const [menyegarkan, setMenyegarkan] = useState(false)
  const [galat, setGalat] = useState('')
  const { sukses, gagal } = useToast()
  const { gelap } = useTheme()

  const muatData = useCallback(
    async ({ manual = false } = {}) => {
      if (manual) {
        setMenyegarkan(true)
      } else {
        setMemuat(true)
      }
      setGalat('')

      try {
        const hasil = await ambilData('/api/dashboard.php')
        setData(hasil)
        if (manual) sukses('Data dashboard berhasil diperbarui.')
      } catch (error) {
        const pesan =
          error instanceof Error
            ? error.message
            : 'Gagal memuat data dashboard.'
        setGalat(pesan)
        if (manual) gagal(pesan)
      } finally {
        setMemuat(false)
        setMenyegarkan(false)
      }
    },
    [sukses, gagal],
  )

  useEffect(() => {
    muatData()
  }, [muatData])

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Ringkasan Toko"
        title="Dashboard"
        description="Pantau performa penjualan dan aktivitas toko secara sekilas."
        action={
          <Button
            variant="secondary"
            size="sm"
            onClick={() => muatData({ manual: true })}
            disabled={memuat || menyegarkan}
          >
            <RefreshCw
              size={15}
              className={menyegarkan ? 'animate-spin' : ''}
            />
            {menyegarkan ? 'Memuat...' : 'Muat Ulang'}
          </Button>
        }
      />

      {memuat && !data && <DashboardSkeleton />}

      {!memuat && !data && galat && (
        <GagalMemuat pesan={galat} onCobaLagi={() => muatData()} />
      )}

      {data && (
        <TataLetakDashboard data={data} gelap={gelap} />
      )}
    </div>
  )
}
