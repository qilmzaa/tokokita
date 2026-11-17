import {
  Loader2,
  MapPin,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Search,
  SearchX,
  Trash2,
  TriangleAlert,
  Users,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import Badge from '../components/Badge'
import Button from '../components/Button'
import Card from '../components/Card'
import EmptyState from '../components/EmptyState'
import Modal from '../components/Modal'
import PageHeader from '../components/PageHeader'
import Skeleton from '../components/Skeleton'
import { useToast } from '../components/Toast'
import { ambilData } from '../lib/api'
import { formatAngka, formatRupiah } from '../lib/format'

const formKosong = { nama_pelanggan: '', kota: '' }

function inisial(nama = '') {
  const bagian = nama.trim().split(/\s+/).filter(Boolean).slice(0, 2)
  if (!bagian.length) return '?'
  return bagian.map((kata) => kata[0]).join('').toUpperCase()
}

export default function Pelanggan() {
  const [daftar, setDaftar] = useState([])
  const [memuat, setMemuat] = useState(true)
  const [galat, setGalat] = useState('')
  const [versi, setVersi] = useState(0)

  const [kataKunci, setKataKunci] = useState('')
  const [pencarian, setPencarian] = useState('')

  const [formTerbuka, setFormTerbuka] = useState(false)
  const [pelangganDiubah, setPelangganDiubah] = useState(null)
  const [form, setForm] = useState(formKosong)
  const [galatForm, setGalatForm] = useState('')
  const [menyimpan, setMenyimpan] = useState(false)

  const [targetHapus, setTargetHapus] = useState(null)
  const [galatHapus, setGalatHapus] = useState('')
  const [menghapus, setMenghapus] = useState(false)

  const { sukses, gagal } = useToast()

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPencarian(kataKunci.trim())
    }, 350)

    return () => window.clearTimeout(timer)
  }, [kataKunci])

  useEffect(() => {
    let aktif = true

    setMemuat(true)
    setGalat('')

    const kueri = pencarian ? `?q=${encodeURIComponent(pencarian)}` : ''

    ambilData(`/api/pelanggan.php${kueri}`)
      .then((hasil) => {
        if (!aktif) return
        setDaftar(Array.isArray(hasil) ? hasil : (hasil?.data ?? []))
      })
      .catch((error) => {
        if (!aktif) return
        setGalat(
          error instanceof Error
            ? error.message
            : 'Gagal memuat data pelanggan.',
        )
      })
      .finally(() => {
        if (aktif) setMemuat(false)
      })

    return () => {
      aktif = false
    }
  }, [pencarian, versi])

  function bersihkanPencarian() {
    setKataKunci('')
    setPencarian('')
  }

  function bukaTambah() {
    setPelangganDiubah(null)
    setForm(formKosong)
    setGalatForm('')
    setFormTerbuka(true)
  }

  function bukaUbah(pelanggan) {
    setPelangganDiubah(pelanggan)
    setForm({
      nama_pelanggan: pelanggan.nama_pelanggan,
      kota: pelanggan.kota ?? '',
    })
    setGalatForm('')
    setFormTerbuka(true)
  }

  function tutupForm() {
    if (!menyimpan) setFormTerbuka(false)
  }

  async function simpanPelanggan(event) {
    event.preventDefault()

    const nama = form.nama_pelanggan.trim()
    if (nama === '') {
      setGalatForm('Nama pelanggan wajib diisi.')
      return
    }

    setMenyimpan(true)
    setGalatForm('')

    try {
      const muatan = {
        nama_pelanggan: nama,
        kota: form.kota.trim(),
      }

      if (pelangganDiubah) {
        await ambilData(
          `/api/pelanggan.php?id=${pelangganDiubah.id_pelanggan}`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(muatan),
          },
        )
        sukses('Data pelanggan berhasil diperbarui.')
      } else {
        await ambilData('/api/pelanggan.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(muatan),
        })
        sukses('Pelanggan baru berhasil ditambahkan.')
        bersihkanPencarian()
      }

      setFormTerbuka(false)
      setVersi((nilai) => nilai + 1)
    } catch (error) {
      const pesan =
        error instanceof Error
          ? error.message
          : 'Gagal menyimpan data pelanggan.'
      setGalatForm(pesan)
      gagal(pesan)
    } finally {
      setMenyimpan(false)
    }
  }

  function bukaHapus(pelanggan) {
    setTargetHapus(pelanggan)
    setGalatHapus('')
  }

  function tutupHapus() {
    if (!menghapus) setTargetHapus(null)
  }

  async function konfirmasiHapus() {
    if (!targetHapus) return

    setMenghapus(true)
    setGalatHapus('')

    try {
      await ambilData(
        `/api/pelanggan.php?id=${targetHapus.id_pelanggan}`,
        { method: 'DELETE' },
      )
      sukses(
        `Pelanggan "${targetHapus.nama_pelanggan}" berhasil dihapus.`,
      )
      setTargetHapus(null)
      setVersi((nilai) => nilai + 1)
    } catch (error) {
      const pesan =
        error instanceof Error
          ? error.message
          : 'Gagal menghapus pelanggan.'
      setGalatHapus(pesan)
      gagal(pesan)
    } finally {
      setMenghapus(false)
    }
  }

  const adaPencarian = pencarian !== ''

  function tombolAksi(pelanggan) {
    return (
      <div className="flex items-center justify-end gap-1">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => bukaUbah(pelanggan)}
          aria-label={`Ubah pelanggan ${pelanggan.nama_pelanggan}`}
          title="Ubah"
        >
          <Pencil size={16} />
        </Button>
        <Button
          variant="dangerGhost"
          size="icon-sm"
          onClick={() => bukaHapus(pelanggan)}
          aria-label={`Hapus pelanggan ${pelanggan.nama_pelanggan}`}
          title="Hapus"
        >
          <Trash2 size={16} />
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Data Master"
        title="Pelanggan"
        description="Kelola data pelanggan yang terdaftar di toko."
        action={
          <Button onClick={bukaTambah}>
            <Plus size={16} />
            Tambah Pelanggan
          </Button>
        }
      />

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-200/80 px-4 py-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="relative w-full sm:max-w-sm">
            <label htmlFor="cari-pelanggan" className="sr-only">
              Cari pelanggan berdasarkan nama atau kota
            </label>
            <Search
              size={17}
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
            />
            <input
              id="cari-pelanggan"
              type="text"
              value={kataKunci}
              onChange={(event) => setKataKunci(event.target.value)}
              placeholder="Cari nama atau kota..."
              autoComplete="off"
              className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-9 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-indigo-400"
            />
            {kataKunci !== '' && (
              <button
                type="button"
                onClick={bersihkanPencarian}
                aria-label="Hapus pencarian"
                className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <p
            aria-live="polite"
            className="text-xs font-medium text-slate-500 dark:text-slate-400"
          >
            {memuat
              ? 'Memuat data...'
              : galat
                ? 'Gagal memuat data'
                : adaPencarian
                  ? `${formatAngka(daftar.length)} hasil`
                  : `${formatAngka(daftar.length)} pelanggan`}
          </p>
        </div>

        {memuat ? (
          <div
            aria-busy="true"
            aria-label="Memuat data pelanggan"
            className="divide-y divide-slate-100 dark:divide-slate-800"
          >
            {[0, 1, 2, 3, 4].map((kunci) => (
              <div
                key={kunci}
                className="flex items-center gap-4 px-5 py-4"
              >
                <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-4 w-40 max-w-full" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="hidden h-4 w-24 sm:block" />
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
            icon={adaPencarian ? SearchX : Users}
            title={
              adaPencarian
                ? 'Pelanggan tidak ditemukan'
                : 'Belum ada pelanggan'
            }
            description={
              adaPencarian
                ? `Tidak ada pelanggan yang cocok dengan kata kunci “${pencarian}”. Coba kata kunci lain atau hapus pencarian.`
                : 'Mulai dengan menambahkan pelanggan pertama ke sistem.'
            }
            action={
              adaPencarian ? (
                <Button variant="secondary" onClick={bersihkanPencarian}>
                  <X size={16} />
                  Hapus Pencarian
                </Button>
              ) : (
                <Button onClick={bukaTambah}>
                  <Plus size={16} />
                  Tambah Pelanggan
                </Button>
              )
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
                      Pelanggan
                    </th>
                    <th scope="col" className="px-5 py-3 font-medium">
                      Kota
                    </th>
                    <th scope="col" className="px-5 py-3 font-medium">
                      Jumlah Transaksi
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
                  {daftar.map((pelanggan) => (
                    <tr
                      key={pelanggan.id_pelanggan}
                      className="transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/30"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-9 w-9 shrink-0 select-none items-center justify-center rounded-full bg-indigo-50 text-[11px] font-semibold text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
                            {inisial(pelanggan.nama_pelanggan)}
                          </span>
                          <span className="whitespace-nowrap font-medium text-slate-800 dark:text-slate-100">
                            {pelanggan.nama_pelanggan}
                          </span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-slate-600 dark:text-slate-300">
                        {pelanggan.kota || '—'}
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge
                          variant={
                            pelanggan.jumlah_transaksi > 0
                              ? 'emerald'
                              : 'slate'
                          }
                        >
                          {formatAngka(pelanggan.jumlah_transaksi)} transaksi
                        </Badge>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-right font-semibold text-slate-900 dark:text-white">
                        {formatRupiah(pelanggan.total_belanja)}
                      </td>
                      <td className="px-5 py-3.5">
                        {tombolAksi(pelanggan)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 md:hidden">
              {daftar.map((pelanggan) => (
                <div
                  key={pelanggan.id_pelanggan}
                  className="flex items-start justify-between gap-3 px-4 py-4"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-9 w-9 shrink-0 select-none items-center justify-center rounded-full bg-indigo-50 text-[11px] font-semibold text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
                        {inisial(pelanggan.nama_pelanggan)}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">
                          {pelanggan.nama_pelanggan}
                        </p>
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                          <MapPin size={12} />
                          {pelanggan.kota || 'Kota belum diisi'}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Badge
                        variant={
                          pelanggan.jumlah_transaksi > 0
                            ? 'emerald'
                            : 'slate'
                        }
                      >
                        {formatAngka(pelanggan.jumlah_transaksi)} transaksi
                      </Badge>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        Total:{' '}
                        <span className="font-semibold text-slate-800 dark:text-slate-100">
                          {formatRupiah(pelanggan.total_belanja)}
                        </span>
                      </span>
                    </div>
                  </div>
                  <div className="shrink-0">{tombolAksi(pelanggan)}</div>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-200/80 px-5 py-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
              Menampilkan {formatAngka(daftar.length)} pelanggan
              {adaPencarian ? ` untuk “${pencarian}”` : ''}
            </div>
          </>
        )}
      </Card>

      <Modal
        open={formTerbuka}
        onClose={tutupForm}
        title={pelangganDiubah ? 'Ubah Pelanggan' : 'Tambah Pelanggan'}
        description={
          pelangganDiubah
            ? 'Perbarui data pelanggan yang dipilih.'
            : 'Masukkan data pelanggan baru.'
        }
        footer={
          <>
            <Button
              variant="secondary"
              onClick={tutupForm}
              disabled={menyimpan}
            >
              Batal
            </Button>
            <Button
              type="submit"
              form="form-pelanggan"
              disabled={menyimpan}
            >
              {menyimpan ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save size={16} />
                  {pelangganDiubah ? 'Simpan Perubahan' : 'Simpan'}
                </>
              )}
            </Button>
          </>
        }
      >
        <form
          id="form-pelanggan"
          onSubmit={simpanPelanggan}
          className="space-y-4"
        >
          {galatForm && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300"
            >
              <TriangleAlert size={16} className="mt-0.5 shrink-0" />
              <span>{galatForm}</span>
            </div>
          )}

          <div>
            <label
              htmlFor="nama-pelanggan"
              className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200"
            >
              Nama Pelanggan <span className="text-rose-500">*</span>
            </label>
            <input
              id="nama-pelanggan"
              type="text"
              value={form.nama_pelanggan}
              onChange={(event) =>
                setForm((sebelumnya) => ({
                  ...sebelumnya,
                  nama_pelanggan: event.target.value,
                }))
              }
              maxLength={100}
              aria-required="true"
              autoFocus
              placeholder="Contoh: Andi Pratama"
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-indigo-400"
            />
            <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
              Wajib diisi, maksimal 100 karakter.
            </p>
          </div>

          <div>
            <label
              htmlFor="kota-pelanggan"
              className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200"
            >
              Kota{' '}
              <span className="font-normal text-slate-400 dark:text-slate-500">
                (opsional)
              </span>
            </label>
            <input
              id="kota-pelanggan"
              type="text"
              value={form.kota}
              onChange={(event) =>
                setForm((sebelumnya) => ({
                  ...sebelumnya,
                  kota: event.target.value,
                }))
              }
              maxLength={50}
              placeholder="Contoh: Ponorogo"
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-indigo-400"
            />
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(targetHapus)}
        onClose={tutupHapus}
        title="Hapus Pelanggan?"
        size="sm"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={tutupHapus}
              disabled={menghapus}
            >
              Batal
            </Button>
            <Button
              variant="danger"
              onClick={konfirmasiHapus}
              disabled={menghapus}
            >
              {menghapus ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Menghapus...
                </>
              ) : (
                <>
                  <Trash2 size={16} />
                  Hapus
                </>
              )}
            </Button>
          </>
        }
      >
        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          Apakah Anda yakin ingin menghapus{' '}
          <strong className="font-semibold text-slate-900 dark:text-white">
            {targetHapus?.nama_pelanggan}
          </strong>
          ? Tindakan ini tidak dapat dibatalkan.
        </p>

        {targetHapus?.jumlah_transaksi > 0 && !galatHapus && (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs leading-relaxed text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
            <TriangleAlert size={15} className="mt-0.5 shrink-0" />
            <span>
              Pelanggan ini memiliki{' '}
              {formatAngka(targetHapus.jumlah_transaksi)} transaksi. Data
              tidak dapat dihapus selama transaksi masih terhubung.
            </span>
          </div>
        )}

        {galatHapus && (
          <div
            role="alert"
            className="mt-4 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs leading-relaxed text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300"
          >
            <TriangleAlert size={15} className="mt-0.5 shrink-0" />
            <span>{galatHapus}</span>
          </div>
        )}
      </Modal>
    </div>
  )
}
