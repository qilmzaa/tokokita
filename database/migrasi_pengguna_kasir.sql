-- Jalankan satu kali pada database db_toko_proyek yang sudah terpasang.
-- Akun demo dibuat otomatis dan kata sandinya di-hash saat API pertama kali dipakai.

USE db_toko_proyek;

CREATE TABLE IF NOT EXISTS tbl_pengguna (
    id_pengguna INT AUTO_INCREMENT PRIMARY KEY,
    nama_lengkap VARCHAR(100) NOT NULL,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    peran ENUM('Admin', 'Kasir') NOT NULL,
    status_aktif TINYINT(1) NOT NULL DEFAULT 1,
    dibuat_pada TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE tbl_transaksi
    ADD COLUMN waktu_transaksi DATETIME NULL AFTER tanggal,
    ADD COLUMN id_pengguna INT NULL AFTER total_belanja,
    ADD COLUMN nama_kasir VARCHAR(100) NULL AFTER id_pengguna,
    ADD COLUMN metode_pembayaran VARCHAR(20) NULL AFTER nama_kasir,
    ADD COLUMN uang_diterima DECIMAL(12,2) NULL AFTER metode_pembayaran,
    ADD COLUMN kembalian DECIMAL(12,2) NULL AFTER uang_diterima,
    ADD COLUMN diskon_nominal DECIMAL(12,2) NOT NULL DEFAULT 0 AFTER kembalian,
    ADD CONSTRAINT fk_transaksi_pengguna
        FOREIGN KEY (id_pengguna) REFERENCES tbl_pengguna(id_pengguna)
        ON DELETE SET NULL;

INSERT INTO tbl_pelanggan (nama_pelanggan, kota)
SELECT 'Umum', NULL
WHERE NOT EXISTS (
    SELECT 1 FROM tbl_pelanggan WHERE nama_pelanggan = 'Umum'
);
