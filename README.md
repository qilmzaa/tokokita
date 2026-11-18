# TokoKita

## Akun Pelanggan Demo

- Username: `user`
- Password: `123` (khusus demo lokal)

Akun demo dibuat otomatis saat API pelanggan pertama kali dipakai. Masuk melalui `#/pelanggan/masuk`; halaman `#/login` hanya untuk Admin/Kasir. Pendaftaran pelanggan baru tetap mewajibkan password minimal 6 karakter. Untuk database lama, API menyiapkan kolom kontak, tabel akun, dan username demo. Alternatifnya, jalankan `database/migrasi_akun_pelanggan.sql` satu kali pada `db_toko_proyek`.

## Memperbarui Skema Transaksi Kasir

Jika database lama menampilkan error kolom transaksi yang tidak ditemukan saat pembayaran, jalankan `database/migrasi_kasir_transaksi.sql` satu kali pada `db_toko_proyek`. Migrasi ini ditujukan untuk skema lama yang memakai kolom `metode_bayar` dan sudah memiliki `id_pengguna`.
