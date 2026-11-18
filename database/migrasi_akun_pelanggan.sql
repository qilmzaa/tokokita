-- Jalankan satu kali pada database db_toko_proyek yang sudah terpasang.

USE db_toko_proyek;

ALTER TABLE tbl_pelanggan
    ADD COLUMN email VARCHAR(254) NULL,
    ADD COLUMN nomor_hp VARCHAR(20) NULL,
    ADD UNIQUE KEY uq_pelanggan_email (email),
    ADD UNIQUE KEY uq_pelanggan_nomor_hp (nomor_hp);

CREATE TABLE tbl_akun_pelanggan (
    id_akun INT AUTO_INCREMENT PRIMARY KEY,
    id_pelanggan INT NOT NULL UNIQUE,
    email VARCHAR(254) NOT NULL UNIQUE,
    nomor_hp VARCHAR(20) NOT NULL UNIQUE,
    username VARCHAR(50) NULL,
    password_hash VARCHAR(255) NOT NULL,
    dibuat_pada TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_akun_pelanggan_username (username),
    FOREIGN KEY (id_pelanggan) REFERENCES tbl_pelanggan(id_pelanggan)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
