import {
  CalendarDays,
  Info,
  Loader2,
  Minus,
  Package,
  Plus,
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
import EmptyState from '../components/EmptyState'
import Modal from '../components/Modal'
import PageHeader from '../components/PageHeader'
import ProductImage from '../components/ProductImage'
import Skeleton from '../components/Skeleton'
import Struk, { cetakStruk } from '../components/Struk'
import { useToast } from '../components/Toast'
import { ambilData } from '../lib/api'
import {
  useKeranjang,
  hapusDariKeranjang,
  kosongkanKeranjang,
  ubahDiskonKeranjang,
  ubahJumlahKeranjang,
} from '../lib/keranjang'
import { formatAngka, formatRupiah } from '../lib/format'

const kelasInput =
  'h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 dark:disabled:bg-slate-900 dark:disabled:text-slate-500 dark:focus:border-indigo-400'

const kelasLabel =
  'mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-300'

function tanggalHariIni() {
  return new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

export default function Keranjang() {
  const isiKeranjang = useKeranjang()

  const [daftarPelanggan, setDaftarPelanggan] = useState([])
  const [daftarProduk, setDaftarProduk] = useState([])
  const [memuatData, setMemuatData] = useState(true)
  const [galatData, setGalatData] = useState('')
  const [versiData, setVersiData] = useState(0)

  const [idPelanggan, setIdPelanggan] = useState('')
  const [tanggal, setTanggal] = useState(tanggalHariIni)
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

  const baris = useMemo(
    () =>
      isiKeranjang.map((item) => ({
        ...item,
        produk: petaProduk.get(String(item.id_produk)) ?? null,
      })),
    [isiKeranjang, petaProduk],
  )

  const barangTidakTersedia = baris.filter((item) => !item.produk)
  const barangMelebihiStok = baris.filter(
    (item) => item.produk && item.jumlah > Number(item.produk.stok),
  )

  const totalJumlah = baris.reduce((jumlah, item) => {
    return item.produk ? jumlah + item.jumlah : jumlah
  }, 0)

  const estimasiTotal = baris.reduce((total, item) => {
    if (!item.produk) return total

    return (
      total +
      Number(item.produk.harga) * item.jumlah * (1 - item.diskon_persen / 100)
    )
  }, 0)

  function kosongkan() {
    kosongkanKeranjang()
    sukses('Keranjang berhasil dikosongkan.')
  }

  async function checkout(event) {
    event.preventDefault()

    if (menyimpan || memuatData) return

    setGalatForm('')

    if (barangTidakTersedia.length > 0) {
      setGalatForm('Hapus produk yang sudah tidak tersedia dari keranjang terlebih dahulu.')
      return
    }

    if (barangMelebihiStok.length > 0) {
      setGalatForm('Kurangi jumlah barang yang melebihi stok tersedia terlebih dahulu.')
      return
    }

    if (idPelanggan === '') {
      setGalatForm('Pilih pelanggan terlebih dahulu.')
      return
    }

    if (tanggal === '') {
      setGalatForm('Tanggal transaksi wajib diisi.')
      return
    }

    setMenyimpan(true)

    try {
      const hasil = await ambilData('/api/transaksi.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_pelanggan: Number(idPelanggan),
          tanggal,
          items: baris.map((item) => ({
            id_produk: item.id_produk,
            jumlah: item.jumlah,
            diskon_persen: item.diskon_persen,
          })),
        }),
      })

      const transaksi = hasil?.data ?? null

      kosongkanKeranjang()
      sukses('Transaksi berhasil disimpan.')

      if (transaksi) {
        setTransaksiBerhasil(transaksi)
      } else {
        gagal('Nomor transaksi tidak diterima sehingga struk belum dapat ditampilkan.')
        navigate('/transaksi')
      }
    } catch (error) {
      const pesan =
        error instanceof Error
          ? error.message
          : 'Gagal menyimpan transaksi.'
      setGalatForm(pesan)
      gagal(pesan)

      // Segarkan info produk karena stok bisa saja berubah.
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

  function hapusTidakTersedia() {
    barangTidakTersedia.forEach((item) => hapusDariKeranjang(item.id_produk))
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Penjualan"
        title="Keranjang"
        description="Tinjau barang yang akan dibeli lalu checkout menjadi transaksi penjualan."
      />

      {memuatData ? (
        <div
          aria-busy="true"
          aria-label="Memuat keranjang"
          className="grid gap-6 lg:grid-cols-3"
        >
          <Card className="space-y-4 p-5 lg:col-span-2 sm:p-6">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
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
      ) : isiKeranjang.length === 0 ? (
        <Card>
          <EmptyState
            icon={ShoppingCart}
            title="Keranjang masih kosong"
            description="Tambahkan produk dari halaman Produk untuk mulai berbelanja."
            action={
              <Button onClick={() => navigate('/produk')}>
                <Package size={16} />
                Lihat Produk
              </Button>
            }
            className="py-14"
          />
        </Card>
      ) : (
        <form
          onSubmit={checkout}
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

            {barangTidakTersedia.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
                <TriangleAlert size={17} className="shrink-0" />
                <span>
                  {formatAngka(barangTidakTersedia.length)} produk di keranjang
                  sudah tidak tersedia di katalog.
                </span>
                <button
                  type="button"
                  onClick={hapusTidakTersedia}
                  className="font-semibold underline underline-offset-2 hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                >
                  Hapus dari keranjang
                </button>
              </div>
            )}

            {barangMelebihiStok.length > 0 && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-relaxed text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300"
              >
                <TriangleAlert size={17} className="mt-0.5 shrink-0" />
                <span>
                  Ada barang yang jumlahnya melebihi stok tersedia. Kurangi
                  jumlah atau hapus barang tersebut sebelum checkout.
                </span>
              </div>
            )}

            <Card className="p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-3 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
                    <ShoppingCart size={17} strokeWidth={1.9} />
                  </span>
                  <div>
                    <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                      Keranjang Belanja
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {formatAngka(baris.length)} jenis barang di keranjang.
                    </p>
                  </div>
                </div>

                <Button variant="dangerGhost" size="sm" onClick={kosongkan}>
                  <Trash2 size={15} />
                  Kosongkan
                </Button>
              </div>

              <div className="mt-4 space-y-3">
                {baris.map((item) => {
                  const { produk } = item

                  if (!produk) {
                    return (
                      <div
                        key={item.id_produk}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50/60 p-3.5 dark:border-amber-500/20 dark:bg-amber-500/5"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300">
                            <TriangleAlert size={17} />
                          </span>
                          <div>
                            <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                              Produk #{item.id_produk} tidak tersedia lagi
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              Produk mungkin sudah dihapus dari katalog.
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="dangerGhost"
                          size="sm"
                          onClick={() => hapusDariKeranjang(item.id_produk)}
                        >
                          <Trash2 size={15} />
                          Hapus
                        </Button>
                      </div>
                    )
                  }

                  const melebihiStok = item.jumlah > Number(produk.stok)

                  return (
                    <div
                      key={item.id_produk}
                      className="rounded-xl border border-slate-200 bg-slate-50/40 p-3.5 dark:border-slate-800 dark:bg-slate-950/30"
                    >
                      <div className="grid gap-3 sm:grid-cols-12">
                        <div className="sm:col-span-4">
                          <div className="flex items-center gap-2.5">
                            <ProductImage
                              foto={produk.foto}
                              nama={produk.nama_produk}
                              className="h-10 w-10"
                              ikonSize={18}
                            />
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">
                                {produk.nama_produk}
                              </p>
                              <Badge variant="indigo" className="mt-1">
                                {produk.nama_kategori}
                              </Badge>
                            </div>
                          </div>
                          <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                            {formatRupiah(produk.harga)} · Stok{' '}
                            {formatAngka(produk.stok)}
                          </p>
                        </div>

                        <div className="sm:col-span-3">
                          <span className={kelasLabel}>Jumlah</span>
                          <div className="flex h-10 w-fit items-center overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-950">
                            <button
                              type="button"
                              onClick={() =>
                                ubahJumlahKeranjang(
                                  item.id_produk,
                                  item.jumlah - 1,
                                )
                              }
                              disabled={item.jumlah <= 1}
                              aria-label={`Kurangi jumlah ${produk.nama_produk}`}
                              className="flex h-full w-9 items-center justify-center text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                            >
                              <Minus size={14} />
                            </button>
                            <input
                              type="number"
                              inputMode="numeric"
                              min="1"
                              step="1"
                              value={item.jumlah}
                              onChange={(event) =>
                                ubahJumlahKeranjang(
                                  item.id_produk,
                                  event.target.value,
                                )
                              }
                              aria-label={`Jumlah ${produk.nama_produk}`}
                              className="h-full w-12 border-x border-slate-200 bg-transparent text-center text-sm font-medium text-slate-900 outline-none dark:border-slate-700 dark:text-white"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                ubahJumlahKeranjang(
                                  item.id_produk,
                                  item.jumlah + 1,
                                )
                              }
                              disabled={item.jumlah >= Number(produk.stok)}
                              aria-label={`Tambah jumlah ${produk.nama_produk}`}
                              className="flex h-full w-9 items-center justify-center text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                          {melebihiStok && (
                            <p className="mt-1.5 text-xs text-rose-600 dark:text-rose-400">
                              Melebihi stok tersedia.
                            </p>
                          )}
                        </div>

                        <div className="sm:col-span-2">
                          <label
                            htmlFor={`diskon-keranjang-${item.id_produk}`}
                            className={kelasLabel}
                          >
                            Diskon (%)
                          </label>
                          <input
                            id={`diskon-keranjang-${item.id_produk}`}
                            type="number"
                            inputMode="decimal"
                            min="0"
                            max="100"
                            step="0.01"
                            value={item.diskon_persen}
                            onChange={(event) =>
                              ubahDiskonKeranjang(
                                item.id_produk,
                                event.target.value,
                              )
                            }
                            className={kelasInput}
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <span className={kelasLabel}>Subtotal</span>
                          <p className="flex h-10 items-center text-sm font-semibold text-slate-900 dark:text-white">
                            {formatRupiah(
                              Number(produk.harga) *
                                item.jumlah *
                                (1 - item.diskon_persen / 100),
                            )}
                          </p>
                        </div>

                        <div className="flex items-end justify-end sm:col-span-1">
                          <Button
                            variant="dangerGhost"
                            size="icon-sm"
                            onClick={() => hapusDariKeranjang(item.id_produk)}
                            aria-label={`Hapus ${produk.nama_produk} dari keranjang`}
                            title="Hapus dari keranjang"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
          </div>

          <aside className="lg:sticky lg:top-24">
            <Card className="p-4 sm:p-5">
              <div className="flex items-center gap-2.5 border-b border-slate-200/80 pb-3 dark:border-slate-800">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
                  <User size={17} strokeWidth={1.9} />
                </span>
                <div>
                  <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                    Checkout
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Pelanggan dan tanggal transaksi.
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-4">
                <div>
                  <label htmlFor="pelanggan-keranjang" className={kelasLabel}>
                    Pelanggan <span className="text-rose-500">*</span>
                  </label>
                  <select
                    id="pelanggan-keranjang"
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
                  <label htmlFor="tanggal-keranjang" className={kelasLabel}>
                    Tanggal <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <CalendarDays
                      size={16}
                      aria-hidden="true"
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
                    />
                    <input
                      id="tanggal-keranjang"
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

              <dl className="mt-4 space-y-2.5 border-t border-slate-200/80 pt-4 text-sm dark:border-slate-800">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-slate-500 dark:text-slate-400">
                    Jenis barang
                  </dt>
                  <dd className="font-medium text-slate-800 dark:text-slate-100">
                    {formatAngka(baris.length - barangTidakTersedia.length)}
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
                  Estimasi hanya untuk tampilan. Total resmi, diskon, dan stok
                  dihitung oleh database saat transaksi disimpan.
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
                    Memproses...
                  </>
                ) : (
                  <>
                    <ShoppingCart size={16} />
                    Bayar Sekarang
                  </>
                )}
              </Button>

              <Button
                variant="secondary"
                className="mt-2 w-full"
                onClick={() => navigate('/produk')}
                disabled={menyimpan}
              >
                <Plus size={16} />
                Tambah Produk Lain
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
        footer={transaksiBerhasil && (
          <>
            <Button variant="secondary" onClick={() => setTransaksiBerhasil(null)}>
              Tutup
            </Button>
            <Button
              variant="secondary"
              onClick={() =>
                navigate(`/transaksi?detail=${transaksiBerhasil.id_transaksi}`)
              }
            >
              Lihat Detail
            </Button>
            <Button onClick={cetakStruk}>Cetak Struk</Button>
          </>
        )}
      >
        {transaksiBerhasil && <Struk transaksi={transaksiBerhasil} />}
      </Modal>
    </div>
  )
}
