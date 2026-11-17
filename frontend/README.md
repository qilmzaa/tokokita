# TokoKita — Frontend

Antarmuka Sistem Informasi Penjualan Toko (XII RPL 1) berbasis React + Vite, Tailwind CSS, React Router (HashRouter), lucide-react, dan Recharts.

## Menjalankan

1. Jalankan **Apache** dan **MySQL** melalui XAMPP.
2. Pastikan database `db_toko_proyek` sudah tersedia.
3. Dari folder ini:

   ```bash
   npm install
   npm run dev
   ```

4. Buka `http://localhost:5173`.

Permintaan ke `/api/...` diteruskan oleh Vite ke `http://localhost/tokokita/api/...`, sehingga tidak perlu konfigurasi CORS.

## Perintah

- `npm run dev` — server pengembangan
- `npm run build` — build produksi ke folder `dist/`
- `npm run preview` — pratinjau hasil build
- `npm run lint` — pemeriksaan kode dengan Oxlint

## Struktur Singkat

- `src/components/` — Card, Button, Modal, Badge, Toast, Skeleton, EmptyState, PageHeader
- `src/layouts/` — sidebar, topbar, dan layout utama
- `src/pages/` — Dashboard, Pelanggan, Produk, Transaksi, Laporan, dan halaman placeholder
- `src/lib/` — API client, format Rupiah/tanggal, tema, navigasi

Aturan pengembangan lengkap ada di [`../AGENTS.md`](../AGENTS.md).
