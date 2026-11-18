# AGENTS.md — TokoKita

Panduan ini wajib diikuti oleh siapa pun (manusia maupun agen AI) yang mengerjakan proyek ini.

## Konteks Proyek

Sistem Informasi Penjualan Toko untuk tugas sekolah kelas **XII RPL 1**, dijalankan di **XAMPP lokal**.

- **Backend:** PHP native tanpa framework, PDO, selalu mengembalikan JSON, berada di folder `api/` dengan URL `http://localhost/tokokita/api/...`.
- **Frontend:** React + Vite + Tailwind CSS + React Router (`HashRouter`) + `lucide-react` (ikon) + Recharts (grafik), berada di folder `frontend/`.
- **Database:** `db_toko_proyek` di `localhost`, user `root`, password kosong.

## Skema Database

Tabel:

- `tbl_pelanggan(id_pelanggan, nama_pelanggan, kota)`
- `tbl_kategori(id_kategori, nama_kategori)`
- `tbl_produk(id_produk, nama_produk, id_kategori, harga, stok, foto)`
- `tbl_transaksi(id_transaksi, tanggal, id_pelanggan, total_belanja)`
- `tbl_detail_transaksi(id_detail, id_transaksi, id_produk, jumlah, harga, diskon_persen, subtotal)`
- `tbl_log(id_log, tabel, aktivitas, keterangan, waktu)`

View:

- `view_laporan_penjualan(id_transaksi, tanggal, nama_pelanggan, kota, nama_kategori, nama_produk, foto, jumlah, harga, diskon_persen, subtotal)`
- `view_total_belanja(id_pelanggan, nama_pelanggan, total_transaksi, total_belanja)`

Stored procedure:

- `TambahTransaksi(IN p_id_pelanggan, IN p_tanggal, OUT p_id_transaksi)`
- `TambahDetailTransaksi(IN p_id_transaksi, IN p_id_produk, IN p_jumlah, IN p_diskon)`

Function:

- `HitungTotal(harga, jumlah)`
- `HitungDiskon(harga, diskon_persen)`

## Aturan Wajib

1. **Semua query database memakai prepared statement** (termasuk query tanpa parameter).
2. **Koneksi database hanya boleh ada di `api/config.php`.** File API lain wajib `require_once` file tersebut.
3. **Semua teks antarmuka berbahasa Indonesia.**
4. **Respons API selalu JSON.** Error berformat `{"error": "pesan"}` dengan kode HTTP yang tepat (400, 404, 405, 500, dst.).
5. **Frontend memanggil API lewat path relatif `/api/...`.** Vite proxy meneruskan `/api` ke `http://localhost` dengan prefiks `/tokokita` (menjadi `http://localhost/tokokita/api/...`).
6. **Jangan membuat fitur di luar tugas** yang sedang dikerjakan. Halaman Log masih berupa placeholder.
7. Jaga konsistensi struktur, penamaan, dan gaya kode di sekitarnya.

## Status Modul

- **Dashboard** — selesai.
- **Pelanggan** — selesai (daftar, pencarian, tambah, ubah, hapus).
- **Produk** — selesai (daftar, pencarian, filter kategori, tambah, ubah, hapus, foto produk: unggah/ganti/hapus).
- **Transaksi** — selesai (daftar, detail, transaksi baru).
- **Keranjang** — selesai (tambah produk ke keranjang dari halaman Produk, atur jumlah/diskon, checkout menjadi transaksi dengan struk).
- **Laporan** — selesai (laporan penjualan dengan filter, cetak, ekspor CSV; rekap belanja pelanggan dengan grafik dan kategori).
- **Log** — masih placeholder.

## Arah Desain

- Modern, rapi, bersih, dan banyak ruang kosong.
- Warna utama **indigo**, netral **slate**, font **Inter**.
- Sidebar di kiri; di layar HP menjadi menu geser (slide-over).
- Topbar dengan tombol mode terang/gelap yang tersimpan di `localStorage`.
- Kartu `rounded-xl` dengan bayangan halus, tabel rapi, badge berwarna lembut.
- Skeleton saat memuat, empty state yang informatif, dan toast untuk notifikasi sukses/gagal.
- Responsif dari layar HP sampai desktop.

## Struktur Folder

```text
tokokita/
├── AGENTS.md
├── api/
│   ├── config.php          # satu-satunya koneksi PDO + helper JSON/error
│   ├── dashboard.php       # endpoint ringkasan dashboard
│   ├── kategori.php        # daftar kategori (GET)
│   ├── pelanggan.php       # CRUD pelanggan (GET/POST/PUT/DELETE)
│   ├── produk.php          # CRUD produk (GET/POST/PUT/DELETE)
│   ├── transaksi.php       # daftar/detail transaksi + simpan transaksi baru
│   ├── uploads/produk/     # foto produk yang diunggah (dilayani Apache)
│   ├── laporan_penjualan.php # laporan penjualan dari view (GET + filter)
│   └── laporan_pelanggan.php # rekap belanja pelanggan dari view (GET)
└── frontend/
    ├── vite.config.js      # proxy /api
    ├── public/images/produk/ # placeholder foto produk (SVG)
    └── src/
        ├── components/     # komponen UI reusable
        ├── layouts/        # layout sidebar + topbar
        ├── pages/          # halaman aplikasi
        ├── lib/            # util (formatRupiah, fetch API, keranjang belanja, kompresi gambar)
        └── ...
```

## Cara Menjalankan

1. Jalankan **Apache** dan **MySQL** dari XAMPP.
2. Masuk ke folder frontend, lalu jalankan:

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

3. Buka URL yang ditampilkan Vite (biasanya `http://localhost:5173`).

## Konvensi Teknis

- PHP: `declare(strict_types=1)`, PDO `ERRMODE_EXCEPTION`, `FETCH_ASSOC`, encoding `utf8mb4`.
- Frontend: komponen fungsi, hooks, Tailwind utility classes, ikon dari `lucide-react`.
- Format uang memakai `formatRupiah` di `src/lib/format.js`.
- Notifikasi memakai `useToast()` dari `src/components/Toast.jsx`.
