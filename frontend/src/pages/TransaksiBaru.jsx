import {
  ArrowLeft,
  CalendarDays,
  Info,
  Loader2,
  Package,
  Plus,
  Save,
  ShoppingCart,
  Trash2,
  TriangleAlert,
  User,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Badge from '../components/Badge'
import Button from '../components/Button'
import Card from '../components/Card'
import Modal from '../components/Modal'
import PageHeader from '../components/PageHeader'
import Skeleton from '../components/Skeleton'
import Struk, { cetakStruk } from '../components/Struk'
import { useToast } from '../components/Toast'
import { ambilData } from '../lib/api'
import { formatAngka, formatRupiah } from '../lib/format'

const kelasInput =
  'h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 dark:disabled:bg-slate-900 dark:disabled:text-slate-500 dark:focus:border-indigo-400'

const kelasLabel =
  'mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-300'

let penghitungBaris = 0

function buatBaris() {
  penghitungBaris += 1
  return {
    key: penghitungBaris,
    id_produk: '',
    jumlah: '1',
    diskon_persen: '0',
  }
}

function tanggalHariIni() {
  return new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

export default function TransaksiBaru() {
  const [daftarPelanggan, setDaftarPelanggan] = useState([])
  const [daftarProduk, setDaftarProduk] = useState([])
  const [memuatData, setMemuatData] = useState(true)
  const [galatData, setGalatData] = useState('')
  const [versiData, setVersiData] = useState(0)

  const [idPelanggan, setIdPelanggan] = useState('')
  const [tanggal, setTanggal] = useState(tanggalHariIni)
  const [items, setItems] = useState(() => [buatBaris()])
  const [galatForm, setGalatForm] = useState('')
  const [menyimpan, setMenyimpan] = useState(false)
  const [transaksiBerhasil, setTransaksiBerhasil] = useState(null)

  const { sukses, gagal } = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    let aktif = true

    setMemuatData(true)
    setGalatData('')

    Promise.all([
      ambilData('/api/pelanggan.php'),
      ambilData('/api/produk.php'),
    ])
      .then(([hasilPelanggan, hasilProduk]) => {
        if (!aktif) return
        setDaftarPelanggan(
          Array.isArray(hasilPelanggan)
            ? hasilPelanggan
            : (hasilPelanggan?.data ?? []),
        )
        setDaftarProduk(
          Array.isArray(hasilProduk)
            ? hasilProduk
            : (hasilProduk?.data ?? []),
        )
      })
      .catch((error) => {
        if (!aktif) return
        setGalatData(
          error instanceof Error
            ? error.message
            : 'Gagal memuat data pelanggan dan produk.',
        )
      })
      .finally(() => {
        if (aktif) setMemuatData(false)
      })

    return () => {
      aktif = false
    }
  }, [versiData])

  const petaProduk = useMemo(
    () =>
      new Map(
        daftarProduk.map((produk) => [String(produk.id_produk), produk]),
      ),
    [daftarProduk],
  )

  function estimasiBaris(item) {
    const produk = petaProduk.get(String(item.id_produk))
    if (!produk) return 0

    const jumlah = Number(item.jumlah)
    if (!Number.isFinite(jumlah) || jumlah <= 0) return 0

    const diskon = Number(item.diskon_persen)
    const persen = Number.isFinite(diskon)
      ? Math.min(Math.max(diskon, 0), 100)
      : 0

    return Number(produk.harga) * jumlah * (1 - persen / 100)
  }

  const totalJumlah = items.reduce((jumlah, item) => {
    const nilai = Number(item.jumlah)
    return Number.isInteger(nilai) && nilai > 0 ? jumlah + nilai : jumlah
  }, 0)

  const estimasiTotal = items.reduce(
    (total, item) => total + estimasiBaris(item),
    0,
  )

  function ubahItem(key, kolom, nilai) {
    setGalatForm('')
    setItems((sebelumnya) =>
      sebelumnya.map((item) =>
        item.key === key ? { ...item, [kolom]: nilai } : item,
      ),
    )
  }

  function tambahBaris() {
    setGalatForm('')
    setItems((sebelumnya) => [...sebelumnya, buatBaris()])
  }

  function hapusBaris(key) {
    setGalatForm('')
    setItems((sebelumnya) => sebelumnya.filter((item) => item.key !== key))
  }

  async function simpanTransaksi(event) {
    event.preventDefault()

    if (menyimpan || memuatData) return

    setGalatForm('')

    if (idPelanggan === '') {
      setGalatForm('Pilih pelanggan terlebih dahulu.')
      return
    }

    if (tanggal === '') {
      setGalatForm('Tanggal transaksi wajib diisi.')
      return
    }

    if (items.length === 0) {
      setGalatForm('Tambahkan minimal satu barang terlebih dahulu.')
      return
    }

    const baris = []

    for (const [index, item] of items.entries()) {
      if (item.id_produk === '') {
        setGalatForm(`Pilih produk pada baris ${index + 1}.`)
        return
      }

      const jumlah = Number(item.jumlah)
      if (!Number.isInteger(jumlah) || jumlah < 1) {
        setGalatForm(
          `Jumlah pada baris ${index + 1} harus bilangan bulat lebih dari 0.`,
        )
        return
      }

      const diskon =
        item.diskon_persen === '' ? 0 : Number(item.diskon_persen)
      if (!Number.isFinite(diskon) || diskon < 0 || diskon > 100) {
        setGalatForm(
          `Diskon pada baris ${index + 1} harus berupa angka antara 0 sampai 100.`,
        )
        return
      }

      baris.push({
        id_produk: Number(item.id_produk),
        jumlah,
        diskon_persen: diskon,
      })
    }

    setMenyimpan(true)

    try {
      const hasilSimpan = await ambilData('/api/transaksi.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_pelanggan: Number(idPelanggan),
          tanggal,
          items: baris,
        }),
      })
      const idTransaksi = hasilSimpan?.data?.id_transaksi
      if (!idTransaksi) {
        sukses('Transaksi berhasil disimpan.')
        gagal('Nomor transaksi tidak diterima sehingga struk belum dapat ditampilkan.')
        navigate('/transaksi')
        return
      }
      sukses('Transaksi berhasil disimpan.')
      try {
        const hasilDetail = await ambilData(`/api/transaksi.php?id=${idTransaksi}`)
        setTransaksiBerhasil(hasilDetail?.data ?? null)
      } catch {
        gagal('Transaksi tersimpan, tetapi data struk gagal dimuat. Buka detail transaksi untuk mencoba lagi.')
        navigate(`/transaksi?detail=${idTransaksi}`)
      }
    } catch (error) {
      const pesan =
        error instanceof Error
          ? error.message
          : 'Gagal menyimpan transaksi.'
      setGalatForm(pesan)
      gagal(pesan)

      // Segarkan info stok tanpa mengubah isian form.
      ambilData('/api/produk.php')
        .then((hasil) => {
          setDaftarProduk(
            Array.isArray(hasil) ? hasil : (hasil?.data ?? []),
          )
        })
        .catch(() => {})
    } finally {
      setMenyimpan(false)
    }
  }

  function mulaiTransaksiBaru() {
    setTransaksiBerhasil(null)
    setIdPelanggan('')
    setTanggal(tanggalHariIni())
    setItems([buatBaris()])
    setGalatForm('')
    setVersiData((nilai) => nilai + 1)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Penjualan"
        title="Transaksi Baru"
        description="Pilih pelanggan dan barang yang dibeli. Total resmi dihitung oleh database saat transaksi disimpan."
        action={
          <Button
            variant="secondary"
            onClick={() => navigate('/transaksi')}
            disabled={menyimpan}
          >
            <ArrowLeft size={16} />
            Kembali
          </Button>
        }
      />

      {memuatData ? (
        <div
          aria-busy="true"
          aria-label="Memuat data transaksi baru"
          className="grid gap-6 lg:grid-cols-3"
        >
          <Card className="space-y-4 p-5 lg:col-span-2 sm:p-6">
            <Skeleton className="h-5 w-40" />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-40 w-full" />
          </Card>
          <Card className="space-y-4 p-5 sm:p-6">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-10 w-full" />
          </Card>
        </div>
      ) : galatData ? (
        <Card className="flex flex-col items-center justify-center px-6 py-14 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
            <TriangleAlert size={26} strokeWidth={1.8} />
          </span>
          <h2 className="mt-4 text-base font-semibold text-slate-900 dark:text-white">
            Gagal memuat data
          </h2>
          <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-slate-500 dark:text-slate-400">
            {galatData}
          </p>
          <Button
            variant="secondary"
            className="mt-5"
            onClick={() => setVersiData((nilai) => nilai + 1)}
          >
            Coba Lagi
          </Button>
        </Card>
      ) : (
        <form
          onSubmit={simpanTransaksi}
          className="grid items-start gap-6 lg:grid-cols-3"
        >
          <div className="space-y-6 lg:col-span-2">
            {galatForm && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-relaxed text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300"
              >
                <TriangleAlert size={17} className="mt-0.5 shrink-0" />
                <span>{galatForm}</span>
              </div>
            )}

            <Card className="p-4 sm:p-5">
              <div className="flex items-center gap-2.5 border-b border-slate-200/80 pb-3 dark:border-slate-800">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
                  <User size={17} strokeWidth={1.9} />
                </span>
                <div>
                  <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                    Informasi Transaksi
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Pelanggan dan tanggal pencatatan.
                  </p>
                </div>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="pelanggan-transaksi" className={kelasLabel}>
                    Pelanggan <span className="text-rose-500">*</span>
                  </label>
                  <select
                    id="pelanggan-transaksi"
                    value={idPelanggan}
                    onChange={(event) => {
                      setGalatForm('')
                      setIdPelanggan(event.target.value)
                    }}
                    aria-required="true"
                    className={kelasInput}
                  >
                    <option value="">Pilih pelanggan</option>
                    {daftarPelanggan.map((pelanggan) => (
                      <option
                        key={pelanggan.id_pelanggan}
                        value={pelanggan.id_pelanggan}
                      >
                        {pelanggan.nama_pelanggan}
                        {pelanggan.kota ? ` — ${pelanggan.kota}` : ''}
                      </option>
                    ))}
                  </select>
                  {daftarPelanggan.length === 0 && (
                    <p className="mt-1.5 text-xs text-amber-600 dark:text-amber-400">
                      Belum ada pelanggan. Tambahkan pelanggan terlebih dahulu.
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="tanggal-transaksi" className={kelasLabel}>
                    Tanggal <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <CalendarDays
                      size={16}
                      aria-hidden="true"
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
                    />
                    <input
                      id="tanggal-transaksi"
                      type="date"
                      value={tanggal}
                      onChange={(event) => {
                        setGalatForm('')
                        setTanggal(event.target.value)
                      }}
                      aria-required="true"
                      className={`${kelasInput} pl-9`}
                    />
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-3 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
                    <ShoppingCart size={17} strokeWidth={1.9} />
                  </span>
                  <div>
                    <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                      Daftar Barang
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Tambahkan barang yang dibeli pelanggan.
                    </p>
                  </div>
                  <Badge
                    variant="slate"
                    className="shrink-0 whitespace-nowrap"
                  >
                    {formatAngka(items.length)} baris
                  </Badge>
                </div>

                <Button variant="secondary" size="sm" onClick={tambahBaris}>
                  <Plus size={15} />
                  Tambah Barang
                </Button>
              </div>

              <div className="mt-4 space-y-3">
                {items.length === 0 ? (
                  <div className="flex flex-col items-center rounded-xl border border-dashed border-slate-300 px-4 py-8 text-center dark:border-slate-700">
                    <Package
                      size={24}
                      strokeWidth={1.8}
                      className="text-slate-400 dark:text-slate-500"
                    />
                    <p className="mt-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                      Belum ada barang
                    </p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Tambahkan minimal satu barang untuk melanjutkan.
                    </p>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="mt-4"
                      onClick={tambahBaris}
                    >
                      <Plus size={15} />
                      Tambah Barang
                    </Button>
                  </div>
                ) : (
                  items.map((item, index) => {
                    const produk = petaProduk.get(String(item.id_produk))
                    const jumlah = Number(item.jumlah)
                    const melebihiStok =
                      Boolean(produk) &&
                      Number.isInteger(jumlah) &&
                      jumlah > Number(produk.stok)

                    return (
                      <div
                        key={item.key}
                        className="rounded-xl border border-slate-200 bg-slate-50/40 p-3.5 dark:border-slate-800 dark:bg-slate-950/30"
                      >
                        <div className="grid gap-3 sm:grid-cols-12">
                          <div className="sm:col-span-5">
                            <label
                              htmlFor={`produk-baris-${item.key}`}
                              className={kelasLabel}
                            >
                              Produk <span className="text-rose-500">*</span>
                            </label>
                            <select
                              id={`produk-baris-${item.key}`}
                              value={item.id_produk}
                              onChange={(event) =>
                                ubahItem(
                                  item.key,
                                  'id_produk',
                                  event.target.value,
                                )
                              }
                              className={kelasInput}
                            >
                              <option value="">Pilih produk</option>
                              {daftarProduk.map((pilihan) => (
                                <option
                                  key={pilihan.id_produk}
                                  value={pilihan.id_produk}
                                  disabled={Number(pilihan.stok) < 1}
                                >
                                  {pilihan.nama_produk}
                                  {Number(pilihan.stok) < 1
                                    ? ' (stok habis)'
                                    : ''}
                                </option>
                              ))}
                            </select>
                            <p
                              className={`mt-1.5 text-xs ${
                                melebihiStok
                                  ? 'text-rose-600 dark:text-rose-400'
                                  : 'text-slate-500 dark:text-slate-400'
                              }`}
                            >
                              {produk
                                ? `${formatRupiah(produk.harga)} · Stok ${formatAngka(produk.stok)}${
                                    melebihiStok ? ' · Melebihi stok' : ''
                                  }`
                                : `Pilih produk untuk melihat harga dan stok.`}
                            </p>
                          </div>

                          <div className="sm:col-span-2">
                            <label
                              htmlFor={`jumlah-baris-${item.key}`}
                              className={kelasLabel}
                            >
                              Jumlah <span className="text-rose-500">*</span>
                            </label>
                            <input
                              id={`jumlah-baris-${item.key}`}
                              type="number"
                              inputMode="numeric"
                              min="1"
                              step="1"
                              value={item.jumlah}
                              onChange={(event) =>
                                ubahItem(
                                  item.key,
                                  'jumlah',
                                  event.target.value,
                                )
                              }
                              aria-required="true"
                              className={kelasInput}
                            />
                          </div>

                          <div className="sm:col-span-2">
                            <label
                              htmlFor={`diskon-baris-${item.key}`}
                              className={kelasLabel}
                            >
                              Diskon (%)
                            </label>
                            <input
                              id={`diskon-baris-${item.key}`}
                              type="number"
                              inputMode="decimal"
                              min="0"
                              max="100"
                              step="0.01"
                              value={item.diskon_persen}
                              onChange={(event) =>
                                ubahItem(
                                  item.key,
                                  'diskon_persen',
                                  event.target.value,
                                )
                              }
                              className={kelasInput}
                            />
                          </div>

                          <div className="sm:col-span-2">
                            <span className={kelasLabel}>Estimasi</span>
                            <p className="flex h-10 items-center text-sm font-semibold text-slate-900 dark:text-white">
                              {formatRupiah(estimasiBaris(item))}
                            </p>
                          </div>

                          <div className="flex items-end justify-end sm:col-span-1">
                            <Button
                              variant="dangerGhost"
                              size="icon-sm"
                              onClick={() => hapusBaris(item.key)}
                              aria-label={`Hapus barang baris ${index + 1}`}
                              title="Hapus barang"
                            >
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </Card>
          </div>

          <aside className="lg:sticky lg:top-24">
            <Card className="p-4 sm:p-5">
              <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                Ringkasan
              </h2>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                Perkiraan sebelum transaksi disimpan.
              </p>

              <dl className="mt-4 space-y-2.5 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-slate-500 dark:text-slate-400">
                    Baris barang
                  </dt>
                  <dd className="font-medium text-slate-800 dark:text-slate-100">
                    {formatAngka(items.length)}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-slate-500 dark:text-slate-400">
                    Total jumlah
                  </dt>
                  <dd className="font-medium text-slate-800 dark:text-slate-100">
                    {formatAngka(totalJumlah)} barang
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3 border-t border-slate-200 pt-3 dark:border-slate-800">
                  <dt className="font-medium text-slate-700 dark:text-slate-200">
                    Estimasi total
                  </dt>
                  <dd className="text-lg font-semibold text-slate-900 dark:text-white">
                    {formatRupiah(estimasiTotal)}
                  </dd>
                </div>
              </dl>

              <div className="mt-4 flex items-start gap-2 rounded-lg bg-slate-50 px-3 py-2.5 text-xs leading-relaxed text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
                <Info size={14} className="mt-0.5 shrink-0" />
                <span>
                  Estimasi hanya untuk tampilan. Total resmi, diskon, dan
                  stok dihitung oleh database saat transaksi disimpan.
                </span>
              </div>

              <Button
                type="submit"
                className="mt-4 w-full"
                disabled={menyimpan || memuatData}
              >
                {menyimpan ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    Simpan Transaksi
                  </>
                )}
              </Button>

              <Button
                variant="secondary"
                className="mt-2 w-full"
                onClick={() => navigate('/transaksi')}
                disabled={menyimpan}
              >
                <ArrowLeft size={16} />
                Kembali ke Daftar
              </Button>
            </Card>
          </aside>
        </form>
      )}
      <Modal
        open={Boolean(transaksiBerhasil)}
        onClose={() => setTransaksiBerhasil(null)}
        title="Transaksi Berhasil"
        description="Pratinjau struk berdasarkan data transaksi dari database."
        size="lg"
        footer={transaksiBerhasil && <>
          <Button variant="secondary" onClick={mulaiTransaksiBaru}>Transaksi Baru</Button>
          <Button variant="secondary" onClick={() => navigate(`/transaksi?detail=${transaksiBerhasil.id_transaksi}`)}>Lihat Detail</Button>
          <Button onClick={cetakStruk}>Cetak Struk</Button>
        </>}
      >
        {transaksiBerhasil && <Struk transaksi={transaksiBerhasil} />}
      </Modal>
    </div>
  )
}
