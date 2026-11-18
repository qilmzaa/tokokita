import {
  ChevronDown,
  ListFilter,
  Loader2,
  Package,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Search,
  SearchX,
  ShoppingCart,
  Trash2,
  TriangleAlert,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import Badge from '../components/Badge'
import Button from '../components/Button'
import Card from '../components/Card'
import EmptyState from '../components/EmptyState'
import ImageUploader from '../components/ImageUploader'
import Modal from '../components/Modal'
import PageHeader from '../components/PageHeader'
import ProductImage from '../components/ProductImage'
import Skeleton from '../components/Skeleton'
import { useToast } from '../components/Toast'
import { ambilData } from '../lib/api'
import { tambahKeKeranjang } from '../lib/keranjang'
import { dataUrlKeBerkas } from '../lib/gambar'
import { formatAngka, formatRupiah } from '../lib/format'
import { useSession } from '../lib/session'

const formKosong = {
  nama_produk: '',
  id_kategori: '',
  harga: '',
  stok: '',
  foto: '',
}

const BATAS_STOK_MENIPIS = 10

export default function Produk() {
  const [daftar, setDaftar] = useState([])
  const [memuat, setMemuat] = useState(true)
  const [galat, setGalat] = useState('')
  const [versi, setVersi] = useState(0)

  const [kategori, setKategori] = useState([])
  const [galatKategori, setGalatKategori] = useState('')
  const [versiKategori, setVersiKategori] = useState(0)

  const [kataKunci, setKataKunci] = useState('')
  const [pencarian, setPencarian] = useState('')
  const [filterKategori, setFilterKategori] = useState('')

  const [formTerbuka, setFormTerbuka] = useState(false)
  const [produkDiubah, setProdukDiubah] = useState(null)
  const [form, setForm] = useState(formKosong)
  const [galatForm, setGalatForm] = useState('')
  const [menyimpan, setMenyimpan] = useState(false)

  const [fotoPratinjau, setFotoPratinjau] = useState(null)

  const [targetHapus, setTargetHapus] = useState(null)
  const [galatHapus, setGalatHapus] = useState('')
  const [menghapus, setMenghapus] = useState(false)

  const { sukses, gagal } = useToast()
  const { pengguna } = useSession()
  const isAdmin = pengguna?.peran === 'Admin'

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPencarian(kataKunci.trim())
    }, 350)

    return () => window.clearTimeout(timer)
  }, [kataKunci])

  useEffect(() => {
    let aktif = true

    setGalatKategori('')

    ambilData('/api/kategori.php')
      .then((hasil) => {
        if (!aktif) return
        setKategori(Array.isArray(hasil) ? hasil : (hasil?.data ?? []))
      })
      .catch((error) => {
        if (!aktif) return
        setGalatKategori(
          error instanceof Error
            ? error.message
            : 'Gagal memuat data kategori.',
        )
      })

    return () => {
      aktif = false
    }
  }, [versiKategori])

  useEffect(() => {
    let aktif = true

    setMemuat(true)
    setGalat('')

    const parameter = new URLSearchParams()
    if (pencarian) parameter.set('q', pencarian)
    if (filterKategori) parameter.set('kategori', filterKategori)

    const kueri = parameter.toString()
    const alamat = `/api/produk.php${kueri ? `?${kueri}` : ''}`

    ambilData(alamat)
      .then((hasil) => {
        if (!aktif) return
        setDaftar(Array.isArray(hasil) ? hasil : (hasil?.data ?? []))
      })
      .catch((error) => {
        if (!aktif) return
        setGalat(
          error instanceof Error
            ? error.message
            : 'Gagal memuat data produk.',
        )
      })
      .finally(() => {
        if (aktif) setMemuat(false)
      })

    return () => {
      aktif = false
    }
  }, [pencarian, filterKategori, versi])

  function muatUlang() {
    setVersi((nilai) => nilai + 1)
    setVersiKategori((nilai) => nilai + 1)
  }

  function bersihkanFilter() {
    setKataKunci('')
    setPencarian('')
    setFilterKategori('')
  }

  function bukaTambah() {
    setProdukDiubah(null)
    setForm(formKosong)
    setGalatForm('')
    setFormTerbuka(true)
  }

  function bukaUbah(produk) {
    setProdukDiubah(produk)
    setForm({
      nama_produk: produk.nama_produk,
      id_kategori: String(produk.id_kategori),
      harga: String(produk.harga),
      stok: String(produk.stok),
      foto: produk.foto ?? '',
    })
    setGalatForm('')
    setFormTerbuka(true)
  }

  function tutupForm() {
    if (!menyimpan) setFormTerbuka(false)
  }

  async function simpanProduk(event) {
    event.preventDefault()

    const nama = form.nama_produk.trim()
    if (nama === '') {
      setGalatForm('Nama produk wajib diisi.')
      return
    }

    if (form.id_kategori === '') {
      setGalatForm('Kategori wajib dipilih.')
      return
    }

    const harga = Number(form.harga)
    if (
      form.harga === '' ||
      !Number.isFinite(harga) ||
      harga < 0
    ) {
      setGalatForm('Harga harus berupa angka 0 atau lebih.')
      return
    }

    const stok = Number(form.stok)
    if (
      form.stok === '' ||
      !Number.isFinite(stok) ||
      stok < 0 ||
      !Number.isInteger(stok)
    ) {
      setGalatForm('Stok harus berupa bilangan bulat 0 atau lebih.')
      return
    }

    setMenyimpan(true)
    setGalatForm('')

    try {
      const muatan = new FormData()
      muatan.append('nama_produk', nama)
      muatan.append('id_kategori', String(Number(form.id_kategori)))
      muatan.append('harga', String(harga))
      muatan.append('stok', String(stok))

      if (form.foto.startsWith('data:')) {
        // Foto baru hasil pratinjau Data URL dikirim sebagai berkas unggahan.
        muatan.append('foto', await dataUrlKeBerkas(form.foto), 'foto.jpg')
      } else if (form.foto === '' && produkDiubah?.foto) {
        // Foto lama dihapus oleh pengguna.
        muatan.append('hapus_foto', '1')
      }

      if (produkDiubah) {
        await ambilData(`/api/produk.php?id=${produkDiubah.id_produk}`, {
          method: 'PUT',
          body: muatan,
        })
        sukses('Data produk berhasil diperbarui.')
      } else {
        await ambilData('/api/produk.php', {
          method: 'POST',
          body: muatan,
        })
        sukses('Produk baru berhasil ditambahkan.')
        bersihkanFilter()
      }

      setFormTerbuka(false)
      setVersi((nilai) => nilai + 1)
    } catch (error) {
      const pesan =
        error instanceof Error
          ? error.message
          : 'Gagal menyimpan data produk.'
      setGalatForm(pesan)
      gagal(pesan)
    } finally {
      setMenyimpan(false)
    }
  }

  function bukaHapus(produk) {
    setTargetHapus(produk)
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
      await ambilData(`/api/produk.php?id=${targetHapus.id_produk}`, {
        method: 'DELETE',
      })
      sukses(`Produk "${targetHapus.nama_produk}" berhasil dihapus.`)
      setTargetHapus(null)
      setVersi((nilai) => nilai + 1)
    } catch (error) {
      const pesan =
        error instanceof Error
          ? error.message
          : 'Gagal menghapus produk.'
      setGalatHapus(pesan)
      gagal(pesan)
    } finally {
      setMenghapus(false)
    }
  }

  const adaFilter = pencarian !== '' || filterKategori !== ''
  const kategoriTerpilih = kategori.find(
    (item) => String(item.id_kategori) === filterKategori,
  )

  function tambahkanKeKeranjang(produk) {
    tambahKeKeranjang(produk.id_produk, 1)
    sukses(`Produk "${produk.nama_produk}" ditambahkan ke keranjang.`)
  }

  function fotoProduk(produk) {
    return (
      <button
        type="button"
        onClick={() => setFotoPratinjau(produk)}
        disabled={!produk.foto}
        aria-label={`Lihat foto produk ${produk.nama_produk}`}
        title={produk.foto ? 'Lihat foto' : 'Belum ada foto'}
        className="shrink-0 rounded-lg outline-none transition focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950"
      >
        <ProductImage
          foto={produk.foto}
          nama={produk.nama_produk}
          className="h-10 w-10"
          ikonSize={18}
        />
      </button>
    )
  }

  function tombolAksi(produk) {
    if (!isAdmin) return null
    const stokHabis = Number(produk.stok) < 1

    return (
      <div className="flex items-center justify-end gap-1">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => tambahkanKeKeranjang(produk)}
          disabled={stokHabis}
          aria-label={`Tambahkan produk ${produk.nama_produk} ke keranjang`}
          title={stokHabis ? 'Stok habis' : 'Tambahkan ke keranjang'}
        >
          <ShoppingCart size={16} />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => bukaUbah(produk)}
          aria-label={`Ubah produk ${produk.nama_produk}`}
          title="Ubah"
        >
          <Pencil size={16} />
        </Button>
        <Button
          variant="dangerGhost"
          size="icon-sm"
          onClick={() => bukaHapus(produk)}
          aria-label={`Hapus produk ${produk.nama_produk}`}
          title="Hapus"
        >
          <Trash2 size={16} />
        </Button>
      </div>
    )
  }

  function labelStok(stok) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
          {formatAngka(stok)}
        </span>
        {stok < BATAS_STOK_MENIPIS && <Badge variant="rose">Stok menipis</Badge>}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Data Master"
        title="Produk"
        description={isAdmin
          ? 'Kelola katalog produk, kategori, harga, dan stok barang.'
          : 'Lihat katalog produk, harga, kategori, dan ketersediaan stok.'}
        action={
          isAdmin && (
            <Button onClick={bukaTambah}>
              <Plus size={16} />
              Tambah Produk
            </Button>
          )
        }
      />

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-200/80 px-4 py-4 dark:border-slate-800 lg:flex-row lg:items-center lg:justify-between lg:px-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-72">
              <label htmlFor="cari-produk" className="sr-only">
                Cari produk berdasarkan nama atau kategori
              </label>
              <Search
                size={17}
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
              />
              <input
                id="cari-produk"
                type="text"
                value={kataKunci}
                onChange={(event) => setKataKunci(event.target.value)}
                placeholder="Cari nama produk..."
                autoComplete="off"
                className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-9 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-indigo-400"
              />
              {kataKunci !== '' && (
                <button
                  type="button"
                  onClick={() => setKataKunci('')}
                  aria-label="Hapus pencarian"
                  className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="relative w-full sm:w-56">
              <label htmlFor="filter-kategori" className="sr-only">
                Filter berdasarkan kategori
              </label>
              <ListFilter
                size={17}
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
              />
              <select
                id="filter-kategori"
                value={filterKategori}
                onChange={(event) => setFilterKategori(event.target.value)}
                className="h-10 w-full appearance-none rounded-lg border border-slate-200 bg-white pl-10 pr-9 text-sm text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-indigo-400"
              >
                <option value="">Semua kategori</option>
                {kategori.map((item) => (
                  <option key={item.id_kategori} value={item.id_kategori}>
                    {item.nama_kategori}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={16}
                aria-hidden="true"
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
              />
            </div>
          </div>

          <p
            aria-live="polite"
            className="text-xs font-medium text-slate-500 dark:text-slate-400"
          >
            {memuat
              ? 'Memuat data...'
              : galat
                ? 'Gagal memuat data'
                : adaFilter
                  ? `${formatAngka(daftar.length)} hasil`
                  : `${formatAngka(daftar.length)} produk`}
          </p>
        </div>

        {galatKategori && !memuat && !galat && (
          <div
            role="alert"
            className="flex flex-wrap items-center gap-2 border-b border-amber-200 bg-amber-50 px-5 py-2.5 text-xs text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300"
          >
            <TriangleAlert size={14} className="shrink-0" />
            <span>Daftar kategori gagal dimuat. Filter kategori terbatas.</span>
            <button
              type="button"
              onClick={() => setVersiKategori((nilai) => nilai + 1)}
              className="font-semibold underline underline-offset-2 hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
            >
              Coba lagi
            </button>
          </div>
        )}

        {memuat ? (
          <div
            aria-busy="true"
            aria-label="Memuat data produk"
            className="divide-y divide-slate-100 dark:divide-slate-800"
          >
            {[0, 1, 2, 3, 4].map((kunci) => (
              <div
                key={kunci}
                className="flex items-center gap-4 px-5 py-4"
              >
                <Skeleton className="h-9 w-9 shrink-0 rounded-lg" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-4 w-44 max-w-full" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="hidden h-5 w-20 sm:block" />
                <Skeleton className="hidden h-4 w-20 md:block" />
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
            <Button variant="secondary" className="mt-5" onClick={muatUlang}>
              <RefreshCw size={15} />
              Coba Lagi
            </Button>
          </div>
        ) : daftar.length === 0 ? (
          <EmptyState
            icon={adaFilter ? SearchX : Package}
            title={adaFilter ? 'Produk tidak ditemukan' : 'Belum ada produk'}
            description={
              adaFilter
                ? `Tidak ada produk yang cocok${
                    pencarian ? ` dengan kata kunci “${pencarian}”` : ''
                  }${
                    kategoriTerpilih
                      ? `${pencarian ? ' dan' : ' dengan'} kategori “${kategoriTerpilih.nama_kategori}”`
                      : ''
                  }. Coba ubah filter atau hapus pencarian.`
                : 'Mulai dengan menambahkan produk pertama ke katalog toko.'
            }
            action={
              adaFilter ? (
                <Button variant="secondary" onClick={bersihkanFilter}>
                  <X size={16} />
                  Reset Filter
                </Button>
              ) : isAdmin ? (
                <Button onClick={bukaTambah}>
                  <Plus size={16} />
                  Tambah Produk
                </Button>
              ) : null
            }
            className="py-14"
          />
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead>
                  <tr className="bg-slate-50/80 text-xs uppercase tracking-wider text-slate-500 dark:bg-slate-800/40 dark:text-slate-400">
                    <th scope="col" className="px-5 py-3 font-medium">
                      Produk
                    </th>
                    <th scope="col" className="px-5 py-3 font-medium">
                      Kategori
                    </th>
                    <th
                      scope="col"
                      className="px-5 py-3 text-right font-medium"
                    >
                      Harga
                    </th>
                    <th scope="col" className="px-5 py-3 font-medium">
                      Stok
                    </th>
                    {isAdmin && <th
                      scope="col"
                      className="px-5 py-3 text-right font-medium"
                    >
                      Aksi
                    </th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {daftar.map((produk) => (
                    <tr
                      key={produk.id_produk}
                      className="transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/30"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          {fotoProduk(produk)}
                          <span className="whitespace-nowrap font-medium text-slate-800 dark:text-slate-100">
                            {produk.nama_produk}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge variant="indigo">
                          {produk.nama_kategori}
                        </Badge>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-right font-semibold text-slate-900 dark:text-white">
                        {formatRupiah(produk.harga)}
                      </td>
                      <td className="px-5 py-3.5">{labelStok(produk.stok)}</td>
                      {isAdmin && <td className="px-5 py-3.5">{tombolAksi(produk)}</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 md:hidden">
              {daftar.map((produk) => (
                <div
                  key={produk.id_produk}
                  className="flex items-start justify-between gap-3 px-4 py-4"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2.5">
                      {fotoProduk(produk)}
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">
                          {produk.nama_produk}
                        </p>
                        <div className="mt-1">
                          <Badge variant="indigo">
                            {produk.nama_kategori}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">
                        {formatRupiah(produk.harga)}
                      </span>
                      {labelStok(produk.stok)}
                    </div>
                  </div>
                  <div className="shrink-0">{tombolAksi(produk)}</div>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-200/80 px-5 py-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
              Menampilkan {formatAngka(daftar.length)} produk
              {pencarian ? ` untuk “${pencarian}”` : ''}
              {kategoriTerpilih ? ` di kategori “${kategoriTerpilih.nama_kategori}”` : ''}
            </div>
          </>
        )}
      </Card>

      <Modal
        open={formTerbuka}
        onClose={tutupForm}
        title={produkDiubah ? 'Ubah Produk' : 'Tambah Produk'}
        description={
          produkDiubah
            ? 'Perbarui data produk yang dipilih.'
            : 'Masukkan data produk baru.'
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
              form="form-produk"
              disabled={menyimpan || kategori.length === 0}
            >
              {menyimpan ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save size={16} />
                  {produkDiubah ? 'Simpan Perubahan' : 'Simpan'}
                </>
              )}
            </Button>
          </>
        }
      >
        <form id="form-produk" onSubmit={simpanProduk} className="space-y-4">
          {galatForm && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300"
            >
              <TriangleAlert size={16} className="mt-0.5 shrink-0" />
              <span>{galatForm}</span>
            </div>
          )}

          {galatKategori && (
            <div
              role="alert"
              className="flex flex-wrap items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300"
            >
              <TriangleAlert size={15} className="shrink-0" />
              <span>Gagal memuat kategori.</span>
              <button
                type="button"
                onClick={() => setVersiKategori((nilai) => nilai + 1)}
                className="font-semibold underline underline-offset-2 hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
              >
                Coba lagi
              </button>
            </div>
          )}

          <div>
            <label
              htmlFor="nama-produk"
              className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200"
            >
              Nama Produk <span className="text-rose-500">*</span>
            </label>
            <input
              id="nama-produk"
              type="text"
              value={form.nama_produk}
              onChange={(event) =>
                setForm((sebelumnya) => ({
                  ...sebelumnya,
                  nama_produk: event.target.value,
                }))
              }
              maxLength={100}
              aria-required="true"
              autoFocus
              placeholder="Contoh: Beras 5 kg"
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-indigo-400"
            />
            <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
              Wajib diisi, maksimal 100 karakter.
            </p>
          </div>

          <ImageUploader
            value={form.foto}
            onChange={(foto) =>
              setForm((sebelumnya) => ({ ...sebelumnya, foto }))
            }
            disabled={menyimpan}
          />

          <div>
            <label
              htmlFor="kategori-produk"
              className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200"
            >
              Kategori <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <select
                id="kategori-produk"
                value={form.id_kategori}
                onChange={(event) =>
                  setForm((sebelumnya) => ({
                    ...sebelumnya,
                    id_kategori: event.target.value,
                  }))
                }
                disabled={kategori.length === 0}
                aria-required="true"
                className="h-10 w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 pr-9 text-sm text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:disabled:bg-slate-900 dark:disabled:text-slate-500 dark:focus:border-indigo-400"
              >
                <option value="">
                  {kategori.length === 0
                    ? 'Memuat kategori...'
                    : 'Pilih kategori'}
                </option>
                {kategori.map((item) => (
                  <option key={item.id_kategori} value={item.id_kategori}>
                    {item.nama_kategori}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={16}
                aria-hidden="true"
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="harga-produk"
                className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200"
              >
                Harga <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 dark:text-slate-500">
                  Rp
                </span>
                <input
                  id="harga-produk"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  value={form.harga}
                  onChange={(event) =>
                    setForm((sebelumnya) => ({
                      ...sebelumnya,
                      harga: event.target.value,
                    }))
                  }
                  aria-required="true"
                  placeholder="0"
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-indigo-400"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="stok-produk"
                className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200"
              >
                Stok <span className="text-rose-500">*</span>
              </label>
              <input
                id="stok-produk"
                type="number"
                inputMode="numeric"
                min="0"
                step="1"
                value={form.stok}
                onChange={(event) =>
                  setForm((sebelumnya) => ({
                    ...sebelumnya,
                    stok: event.target.value,
                  }))
                }
                aria-required="true"
                placeholder="0"
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-indigo-400"
              />
            </div>
          </div>

          <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
            Harga dan stok tidak boleh negatif. Stok di bawah{' '}
            {BATAS_STOK_MENIPIS} akan ditandai sebagai stok menipis.
          </p>
        </form>
      </Modal>

      <Modal
        open={Boolean(targetHapus)}
        onClose={tutupHapus}
        title="Hapus Produk?"
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
            {targetHapus?.nama_produk}
          </strong>
          ? Tindakan ini tidak dapat dibatalkan.
        </p>

        {!galatHapus && (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs leading-relaxed text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
            <TriangleAlert size={15} className="mt-0.5 shrink-0" />
            <span>
              Produk yang sudah digunakan pada transaksi tidak dapat dihapus.
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

      <Modal
        open={Boolean(fotoPratinjau)}
        onClose={() => setFotoPratinjau(null)}
        title="Foto Produk"
        description={fotoPratinjau?.nama_produk ?? ''}
        size="lg"
        footer={
          <Button
            variant="secondary"
            onClick={() => setFotoPratinjau(null)}
          >
            Tutup
          </Button>
        }
      >
        {fotoPratinjau?.foto ? (
          <img
            src={fotoPratinjau.foto}
            alt={`Foto produk ${fotoPratinjau.nama_produk}`}
            className="mx-auto max-h-[60vh] w-auto rounded-xl bg-slate-50 object-contain dark:bg-slate-950"
          />
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
              <Package size={28} strokeWidth={1.8} />
            </span>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Produk ini belum memiliki foto.
            </p>
          </div>
        )}
      </Modal>
    </div>
  )
}
