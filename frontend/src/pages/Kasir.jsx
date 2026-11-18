import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Barcode, Search, ShoppingBag, TriangleAlert } from 'lucide-react'
import Button from '../components/Button'
import Card from '../components/Card'
import CartPanel from '../components/CartPanel'
import EmptyState from '../components/EmptyState'
import PageHeader from '../components/PageHeader'
import ProductCard from '../components/ProductCard'
import ReceiptModal from '../components/ReceiptModal'
import Skeleton from '../components/Skeleton'
import { useToast } from '../components/Toast'
import { ambilData } from '../lib/api'
import {
  useKeranjang,
  hapusDariKeranjang,
  kosongkanKeranjang,
  tambahKeKeranjang,
  ubahJumlahKeranjang,
} from '../lib/keranjang'
import { formatRupiah } from '../lib/format'

const pembulatan = (nilai) => Math.round((Number(nilai) + Number.EPSILON) * 100) / 100

export default function Kasir() {
  const items = useKeranjang()
  const [produk, setProduk] = useState([])
  const [pelanggan, setPelanggan] = useState([])
  const [kategori, setKategori] = useState([])
  const [memuat, setMemuat] = useState(true)
  const [galat, setGalat] = useState('')
  const [pencarian, setPencarian] = useState('')
  const [kategoriAktif, setKategoriAktif] = useState('')
  const [idPelanggan, setIdPelanggan] = useState('')
  const [tipeDiskon, setTipeDiskon] = useState('nominal')
  const [diskon, setDiskon] = useState('0')
  const [metode, setMetode] = useState('Tunai')
  const [uang, setUang] = useState('')
  const [membayar, setMembayar] = useState(false)
  const [struk, setStruk] = useState(null)
  const [panelMobile, setPanelMobile] = useState(false)
  const [versiData, setVersiData] = useState(0)
  const inputCari = useRef(null)
  const { sukses, gagal } = useToast()

  useEffect(() => {
    let aktif = true
    setMemuat(true)
    setGalat('')
    Promise.all([
      ambilData('/api/produk.php'),
      ambilData('/api/pelanggan.php'),
      ambilData('/api/kategori.php'),
    ])
      .then(([hasilProduk, hasilPelanggan, hasilKategori]) => {
        if (!aktif) return
        setProduk(hasilProduk?.data ?? [])
        setPelanggan(hasilPelanggan?.data ?? [])
        setKategori(hasilKategori?.data ?? [])
      })
      .catch((error) => {
        if (aktif) setGalat(error.message || 'Gagal memuat data kasir.')
      })
      .finally(() => { if (aktif) setMemuat(false) })

    return () => { aktif = false }
  }, [versiData])

  const petaProduk = useMemo(
    () => new Map(produk.map((item) => [Number(item.id_produk), item])),
    [produk],
  )
  const baris = useMemo(
    () => items.map((item) => ({ item, produk: petaProduk.get(Number(item.id_produk)) ?? null })),
    [items, petaProduk],
  )
  const produkTampil = useMemo(() => {
    const istilah = pencarian.trim().toLocaleLowerCase('id-ID')
    return produk.filter((item) => {
      const cocokKategori = !kategoriAktif || String(item.id_kategori) === kategoriAktif
      const cocokCari = !istilah || item.nama_produk.toLocaleLowerCase('id-ID').includes(istilah)
      return cocokKategori && cocokCari
    })
  }, [produk, pencarian, kategoriAktif])

  const subtotal = pembulatan(baris.reduce((jumlah, { item, produk: data }) => (
    data ? jumlah + Number(data.harga) * Number(item.jumlah) * (1 - Number(item.diskon_persen || 0) / 100) : jumlah
  ), 0))
  const nilaiDiskon = tipeDiskon === 'persen'
    ? pembulatan(subtotal * Math.min(100, Math.max(0, Number(diskon) || 0)) / 100)
    : Math.min(subtotal, Math.max(0, pembulatan(Number(diskon) || 0)))
  const total = Math.max(0, pembulatan(subtotal - nilaiDiskon))
  const jumlahTidakValid = baris.some(({ item, produk: data }) => !data || Number(item.jumlah) > Number(data.stok))
  const pembayaranCukup = metode !== 'Tunai' || (Number(uang) || 0) >= total
  const bolehBayar = baris.length > 0 && !jumlahTidakValid && pembayaranCukup && !memuat
  const jumlahItem = baris.reduce((jumlah, { item }) => jumlah + Number(item.jumlah), 0)

  function tambah(produkDipilih) {
    const jumlahSudahAda = items.find((item) => Number(item.id_produk) === Number(produkDipilih.id_produk))?.jumlah ?? 0
    if (Number(produkDipilih.stok) < jumlahSudahAda + 1) {
      gagal(`Stok ${produkDipilih.nama_produk} tidak mencukupi.`)
      return
    }
    tambahKeKeranjang(produkDipilih.id_produk)
    sukses(`${produkDipilih.nama_produk} ditambahkan ke keranjang.`)
  }

  function ubahJumlah(id, jumlahBaru) {
    const produkItem = petaProduk.get(Number(id))
    if (!produkItem) return
    const angka = Math.max(1, Math.min(Number(produkItem.stok), Math.floor(Number(jumlahBaru) || 1)))
    ubahJumlahKeranjang(id, angka)
  }

  function inputBarcode(event) {
    if (event.key !== 'Enter') return
    event.preventDefault()
    const kode = pencarian.trim()
    if (!kode) return
    const cocok = produk.find((item) => String(item.id_produk) === kode)
    if (!cocok) {
      gagal('Kode produk tidak ditemukan. Masukkan ID produk atau cari berdasarkan nama.')
      return
    }
    tambah(cocok)
    setPencarian('')
  }

  const prosesBayar = useCallback(async () => {
    if (!bolehBayar || membayar) {
      if (metode === 'Tunai' && !pembayaranCukup) gagal('Uang yang diterima masih kurang.')
      return
    }
    setMembayar(true)
    try {
      const namaPelanggan = pelanggan.find((item) => String(item.id_pelanggan) === idPelanggan)?.nama_pelanggan ?? 'Umum'
      const hasil = await ambilData('/api/kasir.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_pelanggan: idPelanggan ? Number(idPelanggan) : null,
          nama_pelanggan: namaPelanggan,
          items: baris.map(({ item }) => ({
            id_produk: Number(item.id_produk),
            jumlah: Number(item.jumlah),
            diskon_persen: Number(item.diskon_persen || 0),
          })),
          tipe_diskon: tipeDiskon,
          diskon: Number(diskon) || 0,
          metode_pembayaran: metode,
          uang_diterima: metode === 'Tunai' ? Number(uang) : total,
        }),
      })
      kosongkanKeranjang()
      sukses('Pembayaran berhasil dan transaksi tersimpan.')
      setStruk(hasil?.data ?? null)
      setDiskon('0')
      setUang('')
      setPanelMobile(false)
      setVersiData((nilai) => nilai + 1)
    } catch (error) {
      gagal(error.message || 'Pembayaran gagal diproses.')
      setVersiData((nilai) => nilai + 1)
    } finally {
      setMembayar(false)
    }
  }, [bolehBayar, baris, diskon, gagal, idPelanggan, metode, membayar, pelanggan, pembayaranCukup, sukses, tipeDiskon, total, uang])

  function kosongkan() {
    kosongkanKeranjang()
    setDiskon('0')
    setUang('')
    sukses('Keranjang berhasil dikosongkan.')
  }

  useEffect(() => {
    function pintasan(event) {
      if (event.key === 'F2') {
        event.preventDefault()
        inputCari.current?.focus()
      }
      if (event.key === 'F9') {
        event.preventDefault()
        if (panelMobile) setPanelMobile(false)
        prosesBayar()
      }
    }
    window.addEventListener('keydown', pintasan)
    return () => window.removeEventListener('keydown', pintasan)
  }, [panelMobile, prosesBayar])

  const panelProps = {
    baris,
    subtotal,
    diskon,
    tipeDiskon,
    onTipeDiskon: setTipeDiskon,
    onDiskon: setDiskon,
    idPelanggan,
    pelanggan,
    onPelanggan: setIdPelanggan,
    metode,
    onMetode: setMetode,
    uang,
    onUang: setUang,
    total,
    onJumlah: ubahJumlah,
    onHapus: hapusDariKeranjang,
    onKosongkan: kosongkan,
    onBayar: prosesBayar,
    bolehBayar,
    membayar,
  }

  return (
    <div className="space-y-5 pb-24 xl:pb-0">
      <PageHeader eyebrow="Penjualan" title="Kasir" description="Pilih produk, atur pembayaran, lalu cetak struk transaksi." />

      {galat && <div role="alert" className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300"><TriangleAlert size={17} />{galat}<Button className="ml-auto" size="sm" variant="secondary" onClick={() => setVersiData((nilai) => nilai + 1)}>Coba lagi</Button></div>}

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_390px]">
        <section className="min-w-0 space-y-4">
          <Card className="p-4 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row">
              <label className="relative min-w-0 flex-1">
                <span className="sr-only">Cari nama atau kode produk</span>
                <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input ref={inputCari} value={pencarian} onChange={(event) => setPencarian(event.target.value)} onKeyDown={inputBarcode} placeholder="Cari nama produk atau masukkan ID lalu Enter..." className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
              </label>
              <div className="flex items-center gap-2 text-xs text-slate-400"><Barcode size={17} /><span>F2 cari · F9 bayar</span></div>
            </div>
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              <button type="button" onClick={() => setKategoriAktif('')} className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium ${kategoriAktif === '' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>Semua kategori</button>
              {kategori.map((item) => <button key={item.id_kategori} type="button" onClick={() => setKategoriAktif(String(item.id_kategori))} className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium ${kategoriAktif === String(item.id_kategori) ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>{item.nama_kategori}</button>)}
            </div>
          </Card>

          {memuat ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{[1, 2, 3, 4, 5, 6, 7, 8].map((item) => <Skeleton key={item} className="h-48 rounded-xl" />)}</div>
          ) : galat ? null : produkTampil.length === 0 ? (
            <Card><EmptyState icon={ShoppingBag} title="Produk tidak ditemukan" description="Coba ubah kata pencarian atau filter kategori." className="py-12" /></Card>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {produkTampil.map((item) => <ProductCard key={item.id_produk} produk={item} onTambah={tambah} />)}
            </div>
          )}
        </section>

        <div className="hidden xl:block">
          <Card className="sticky top-20 p-4 sm:p-5"><CartPanel idAwalan="kasir-desktop" {...panelProps} /></Card>
        </div>
      </div>

      <button type="button" onClick={() => setPanelMobile(true)} className="fixed inset-x-4 bottom-4 z-30 flex items-center justify-between rounded-xl bg-indigo-600 px-4 py-3.5 text-white shadow-xl shadow-indigo-900/20 xl:hidden">
        <span className="flex items-center gap-2 text-sm font-semibold"><ShoppingBag size={18} />Keranjang · {jumlahItem} item</span><span className="text-sm font-bold">{formatRupiah(total)}</span>
      </button>

      {panelMobile && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-slate-950/50 p-0 backdrop-blur-sm xl:hidden" onClick={() => setPanelMobile(false)}>
          <div onClick={(event) => event.stopPropagation()} className="max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white p-4 shadow-2xl dark:bg-slate-900 sm:max-w-xl sm:rounded-2xl">
            <CartPanel idAwalan="kasir-mobile" {...panelProps} />
          </div>
        </div>
      )}

      <ReceiptModal transaksi={struk} onTransaksiBaru={() => setStruk(null)} />
    </div>
  )
}
