import {
  BarChart3,
  CircleUserRound,
  History,
  LayoutDashboard,
  Package,
  ScanBarcode,
  ShoppingBag,
  ShoppingCart,
  Users,
} from 'lucide-react'

export const menuNavigasi = [
  {
    to: '/',
    label: 'Dashboard',
    ikon: LayoutDashboard,
    deskripsi:
      'Pantau ringkasan pelanggan, produk, transaksi, dan penjualan toko.',
  },
  {
    to: '/pelanggan',
    label: 'Pelanggan',
    ikon: Users,
    deskripsi: 'Kelola data pelanggan yang terdaftar di toko.',
  },
  {
    to: '/produk',
    label: 'Produk',
    ikon: Package,
    deskripsi: 'Kelola katalog produk, kategori, harga, dan stok barang.',
  },
  {
    to: '/kasir',
    label: 'Kasir',
    ikon: ScanBarcode,
    deskripsi: 'Layani penjualan dan pembayaran pelanggan.',
  },
  {
    to: '/keranjang',
    label: 'Keranjang',
    ikon: ShoppingBag,
    deskripsi: 'Tinjau barang di keranjang dan checkout menjadi transaksi.',
  },
  {
    to: '/pengguna',
    label: 'Pengguna',
    ikon: CircleUserRound,
    deskripsi: 'Kelola akun Admin dan Kasir.',
  },
  {
    to: '/transaksi',
    label: 'Transaksi',
    ikon: ShoppingCart,
    deskripsi: 'Catat dan tinjau transaksi penjualan toko.',
  },
  {
    to: '/laporan',
    label: 'Laporan',
    ikon: BarChart3,
    deskripsi: 'Lihat laporan penjualan dan rekap belanja pelanggan.',
  },
  {
    to: '/log',
    label: 'Log',
    ikon: History,
    deskripsi: 'Pantau riwayat aktivitas yang tercatat pada sistem.',
  },
]

export function labelHalaman(pathname) {
  if (pathname.startsWith('/transaksi/baru')) return 'Transaksi Baru'

  return menuNavigasi.find((item) => item.to === pathname)?.label ?? 'TokoKita'
}
