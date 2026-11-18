import { useEffect, useState } from 'react'
import { LogOut, Moon, Store, Sun, TriangleAlert } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Badge from '../components/Badge'
import Button from '../components/Button'
import Card from '../components/Card'
import EmptyState from '../components/EmptyState'
import ProductImage from '../components/ProductImage'
import Skeleton from '../components/Skeleton'
import { useToast } from '../components/Toast'
import { ambilData } from '../lib/api'
import { formatAngka, formatRupiah } from '../lib/format'
import { useTheme } from '../lib/theme'

export default function CustomerBeranda({ profil }) {
  const [produk, setProduk] = useState([])
  const [memuat, setMemuat] = useState(true)
  const [galat, setGalat] = useState('')
  const [keluar, setKeluar] = useState(false)
  const navigate = useNavigate()
  const { gelap, gantiTema } = useTheme()
  const { gagal } = useToast()

  useEffect(() => {
    let aktif = true
    ambilData('/api/produk_pelanggan.php')
      .then((hasil) => { if (aktif) setProduk(hasil?.data ?? []) })
      .catch((error) => { if (aktif) setGalat(error.message || 'Gagal memuat produk.') })
      .finally(() => { if (aktif) setMemuat(false) })

    return () => { aktif = false }
  }, [])

  async function logout() {
    if (keluar) return
    setKeluar(true)
    try {
      await ambilData('/api/pelanggan_auth.php', { method: 'DELETE' })
      window.localStorage.removeItem('tokokita_mode')
      navigate('/pelanggan/masuk', { replace: true })
    } catch (error) {
      gagal(error.message || 'Gagal keluar dari akun.')
    } finally {
      setKeluar(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/85 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/85">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white"><Store size={20} /></span>
            <span className="text-base font-semibold tracking-tight text-slate-900 dark:text-white">TokoKita</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon-sm" onClick={gantiTema} aria-label={gelap ? 'Aktifkan mode terang' : 'Aktifkan mode gelap'}>{gelap ? <Sun size={17} /> : <Moon size={17} />}</Button>
            <Button variant="secondary" size="sm" onClick={logout} disabled={keluar}><LogOut size={15} />{keluar ? 'Keluar...' : 'Keluar'}</Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <Card className="overflow-hidden border-0 bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700 p-6 text-white shadow-lg shadow-indigo-900/10 sm:p-8">
          <p className="text-sm font-medium text-indigo-100">Beranda Pelanggan</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Halo, {profil?.nama_lengkap || 'Pelanggan'}!</h1>
          <p className="mt-2 text-sm text-indigo-100">Selamat berbelanja. Lihat pilihan produk TokoKita di bawah ini.</p>
        </Card>

        <section>
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Daftar Produk</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Produk tersedia di toko kami.</p>
          </div>
          {galat ? (
            <Card className="flex items-center gap-3 p-5 text-sm text-rose-700 dark:text-rose-300"><TriangleAlert size={18} />{galat}</Card>
          ) : memuat ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">{[1, 2, 3, 4, 5].map((item) => <Skeleton key={item} className="h-64 rounded-xl" />)}</div>
          ) : produk.length === 0 ? (
            <Card><EmptyState title="Belum ada produk" description="Silakan kunjungi kembali nanti." className="py-12" /></Card>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {produk.map((item) => (
                <Card key={item.id_produk} className="overflow-hidden p-3">
                  <ProductImage foto={item.foto} nama={item.nama_produk} className="h-36 w-full rounded-lg sm:h-44" ikonSize={28} />
                  <h3 className="mt-3 line-clamp-2 min-h-10 text-sm font-semibold text-slate-800 dark:text-slate-100">{item.nama_produk}</h3>
                  {item.nama_kategori && <Badge variant="indigo" className="mt-1">{item.nama_kategori}</Badge>}
                  <p className="mt-2 text-sm font-bold text-indigo-600 dark:text-indigo-300">{formatRupiah(item.harga)}</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{Number(item.stok) > 0 ? `Stok ${formatAngka(item.stok)}` : 'Stok habis'}</p>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
