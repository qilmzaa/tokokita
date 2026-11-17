import { ChevronLeft, ChevronRight, History, RefreshCw, TriangleAlert } from 'lucide-react'
import { useEffect, useState } from 'react'
import Badge from '../components/Badge'
import Button from '../components/Button'
import Card from '../components/Card'
import EmptyState from '../components/EmptyState'
import PageHeader from '../components/PageHeader'
import Skeleton from '../components/Skeleton'
import { ambilData } from '../lib/api'
import { formatAngka, formatWaktu } from '../lib/format'

const PER_HALAMAN = 20

function gayaAktivitas(aktivitas = '') {
  const jenis = aktivitas.toUpperCase()
  if (jenis === 'INSERT') return 'emerald'
  if (jenis === 'UPDATE HARGA') return 'amber'
  if (jenis === 'UPDATE STOK') return 'sky'
  return 'slate'
}

function BarisSkeleton() {
  return Array.from({ length: 5 }, (_, indeks) => (
    <div key={indeks} className="grid grid-cols-1 gap-3 border-b border-slate-100 px-4 py-4 dark:border-slate-800 sm:grid-cols-[minmax(0,1fr)_10rem_12rem] sm:items-center sm:px-5">
      <div className="space-y-2"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-56 max-w-full" /></div>
      <Skeleton className="h-6 w-28" /><Skeleton className="h-4 w-36" />
    </div>
  ))
}

export default function Log() {
  const [daftar, setDaftar] = useState([])
  const [daftarTabel, setDaftarTabel] = useState([])
  const [tabel, setTabel] = useState('')
  const [halaman, setHalaman] = useState(1)
  const [pagination, setPagination] = useState({ page: 1, per_page: PER_HALAMAN, total: 0, total_halaman: 0 })
  const [memuat, setMemuat] = useState(true)
  const [galat, setGalat] = useState('')
  const [versi, setVersi] = useState(0)

  useEffect(() => {
    let aktif = true
    setMemuat(true)
    setGalat('')
    const parameter = new URLSearchParams({ page: String(halaman), per_page: String(PER_HALAMAN) })
    if (tabel) parameter.set('tabel', tabel)

    ambilData(`/api/log.php?${parameter.toString()}`)
      .then((hasil) => {
        if (!aktif) return
        setDaftar(Array.isArray(hasil?.data) ? hasil.data : [])
        setDaftarTabel(Array.isArray(hasil?.tabel) ? hasil.tabel : [])
        setPagination(hasil?.pagination ?? { page: halaman, per_page: PER_HALAMAN, total: 0, total_halaman: 0 })
      })
      .catch((error) => {
        if (aktif) setGalat(error instanceof Error ? error.message : 'Gagal memuat log aktivitas.')
      })
      .finally(() => { if (aktif) setMemuat(false) })

    return () => { aktif = false }
  }, [halaman, tabel, versi])

  function muatUlang() { setVersi((nilai) => nilai + 1) }
  function ubahTabel(event) { setTabel(event.target.value); setHalaman(1) }
  const totalHalaman = Number(pagination.total_halaman) || 0

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Aktivitas Sistem" title="Log" description="Riwayat perubahan data yang dicatat otomatis oleh sistem."
        action={<Button variant="secondary" onClick={muatUlang} disabled={memuat}><RefreshCw size={16} className={memuat ? 'animate-spin' : ''} />Muat Ulang</Button>} />
      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-200/80 p-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div><h2 className="text-sm font-semibold text-slate-900 dark:text-white">Riwayat aktivitas</h2><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{formatAngka(pagination.total)} catatan</p></div>
          <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 sm:min-w-52">Filter nama tabel
            <select value={tabel} onChange={ubahTabel} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/15 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200">
              <option value="">Semua tabel</option>{daftarTabel.map((nama) => <option key={nama} value={nama}>{nama}</option>)}
            </select>
          </label>
        </div>
        <div className="hidden grid-cols-[minmax(0,1fr)_10rem_12rem] gap-3 bg-slate-50/80 px-5 py-2.5 text-xs font-medium uppercase tracking-wider text-slate-500 dark:bg-slate-800/40 dark:text-slate-400 sm:grid"><span>Catatan</span><span>Aktivitas</span><span>Waktu</span></div>
        {memuat ? <BarisSkeleton /> : galat ? (
          <div className="px-4 py-10 sm:px-5"><EmptyState icon={TriangleAlert} title="Log gagal dimuat" description={galat} action={<Button variant="secondary" onClick={muatUlang}><RefreshCw size={15} />Coba Lagi</Button>} /></div>
        ) : daftar.length === 0 ? (
          <div className="px-4 py-10 sm:px-5"><EmptyState icon={History} title="Belum ada aktivitas" description={tabel ? `Belum ada catatan untuk tabel ${tabel}.` : 'Catatan akan muncul di sini saat trigger database mencatat perubahan.'} /></div>
        ) : (
          <div>{daftar.map((item) => (
            <article key={item.id_log} className="grid grid-cols-1 gap-2 border-b border-slate-100 px-4 py-4 last:border-0 dark:border-slate-800 sm:grid-cols-[minmax(0,1fr)_10rem_12rem] sm:items-center sm:gap-3 sm:px-5">
              <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="text-sm font-medium text-slate-800 dark:text-slate-100">{item.tabel}</span><span className="text-xs text-slate-400">#{item.id_log}</span></div><p className="mt-1 break-words text-sm leading-relaxed text-slate-500 dark:text-slate-400">{item.keterangan || 'Tidak ada keterangan.'}</p></div>
              <div><span className="mr-2 text-xs text-slate-400 sm:hidden">Aktivitas</span><Badge variant={gayaAktivitas(item.aktivitas)}>{item.aktivitas}</Badge></div>
              <time className="text-xs text-slate-500 dark:text-slate-400" dateTime={item.waktu}><span className="mr-2 sm:hidden">Waktu</span>{formatWaktu(item.waktu)}</time>
            </article>
          ))}</div>
        )}
        {!galat && totalHalaman > 0 && <div className="flex flex-col gap-3 border-t border-slate-200/80 px-4 py-3 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <p className="text-xs text-slate-500 dark:text-slate-400">Halaman {pagination.page} dari {totalHalaman}</p>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => setHalaman((nilai) => Math.max(1, nilai - 1))} disabled={memuat || halaman <= 1}><ChevronLeft size={16} />Sebelumnya</Button>
            <Button variant="secondary" size="sm" onClick={() => setHalaman((nilai) => Math.min(totalHalaman, nilai + 1))} disabled={memuat || halaman >= totalHalaman}>Berikutnya<ChevronRight size={16} /></Button>
          </div>
        </div>}
      </Card>
    </div>
  )
}