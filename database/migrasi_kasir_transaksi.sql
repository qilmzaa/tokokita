-- Jalankan satu kali pada db_toko_proyek yang memiliki kolom metode_bayar
-- dan id_pengguna pada tbl_transaksi.
-- Menyesuaikan skema lama agar cocok dengan INSERT pada api/kasir.php.

USE db_toko_proyek;

ALTER TABLE tbl_transaksi
    CHANGE COLUMN metode_bayar metode_pembayaran VARCHAR(20) NOT NULL DEFAULT 'Tunai',
    ADD COLUMN waktu_transaksi DATETIME NULL AFTER tanggal,
    ADD COLUMN nama_kasir VARCHAR(100) NULL AFTER id_pengguna,
    ADD COLUMN uang_diterima DECIMAL(12,2) NULL AFTER metode_pembayaran,
    ADD COLUMN kembalian DECIMAL(12,2) NULL AFTER uang_diterima,
    ADD COLUMN diskon_nominal DECIMAL(12,2) NOT NULL DEFAULT 0 AFTER kembalian;
