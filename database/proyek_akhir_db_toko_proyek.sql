-- =====================================================
-- Proyek Terintegrasi : Database Sistem Informasi Penjualan Toko
-- Mata Pelajaran : Basis Data (XII RPL 1)
-- Memakai nama tabel sesuai modul (tbl_...).
-- Database dipisah (db_toko_proyek) agar tidak mengganggu jobsheet 1-5.
-- =====================================================

DROP DATABASE IF EXISTS db_toko_proyek;
CREATE DATABASE db_toko_proyek;
USE db_toko_proyek;

-- =====================================================
-- A. STRUKTUR DATABASE (6 tabel)
-- =====================================================
CREATE TABLE tbl_pelanggan (
    id_pelanggan INT AUTO_INCREMENT PRIMARY KEY,
    nama_pelanggan VARCHAR(100) NOT NULL,
    kota VARCHAR(50)
) ENGINE=InnoDB;

CREATE TABLE tbl_kategori (
    id_kategori INT AUTO_INCREMENT PRIMARY KEY,
    nama_kategori VARCHAR(50) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE tbl_produk (
    id_produk INT AUTO_INCREMENT PRIMARY KEY,
    nama_produk VARCHAR(100) NOT NULL,
    id_kategori INT NOT NULL,
    harga DECIMAL(12,2) NOT NULL,
    stok INT NOT NULL DEFAULT 0,
    FOREIGN KEY (id_kategori) REFERENCES tbl_kategori(id_kategori)
) ENGINE=InnoDB;

CREATE TABLE tbl_transaksi (
    id_transaksi INT AUTO_INCREMENT PRIMARY KEY,
    tanggal DATE NOT NULL,
    id_pelanggan INT NOT NULL,
    total_belanja DECIMAL(12,2) NOT NULL DEFAULT 0,
    FOREIGN KEY (id_pelanggan) REFERENCES tbl_pelanggan(id_pelanggan)
) ENGINE=InnoDB;

CREATE TABLE tbl_detail_transaksi (
    id_detail INT AUTO_INCREMENT PRIMARY KEY,
    id_transaksi INT NOT NULL,
    id_produk INT NOT NULL,
    jumlah INT NOT NULL,
    harga DECIMAL(12,2) NOT NULL,
    diskon_persen DECIMAL(5,2) NOT NULL DEFAULT 0,
    subtotal DECIMAL(12,2) NOT NULL,
    FOREIGN KEY (id_transaksi) REFERENCES tbl_transaksi(id_transaksi),
    FOREIGN KEY (id_produk) REFERENCES tbl_produk(id_produk)
) ENGINE=InnoDB;

CREATE TABLE tbl_log (
    id_log INT AUTO_INCREMENT PRIMARY KEY,
    tabel VARCHAR(50),
    aktivitas VARCHAR(50),
    keterangan VARCHAR(255),
    waktu TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- =====================================================
-- B. DATA AWAL
-- =====================================================
INSERT INTO tbl_kategori (nama_kategori) VALUES
('Sembako'), ('Minuman'), ('Makanan Ringan'), ('Kebersihan'), ('Perlengkapan Dapur');

INSERT INTO tbl_produk (nama_produk, id_kategori, harga, stok) VALUES
('Beras 5 kg',      1,  65000, 100),
('Minyak Goreng 2L',1,  36000, 100),
('Gula Pasir 1 kg', 1,  16000, 100),
('Teh Celup',       2,   9000, 100),
('Kopi Sachet',     2,   2000, 200),
('Keripik Singkong',3,  12000,  80),
('Wafer Cokelat',   3,   7500,  80),
('Sabun Mandi',     4,   4500, 150),
('Detergen 800 g',  4,  22000,  90),
('Wajan Anti Lengket',5,125000, 20);

INSERT INTO tbl_pelanggan (nama_pelanggan, kota) VALUES
('Andi',   'Ponorogo'),
('Budi',   'Madiun'),
('Citra',  'Surabaya'),
('Dewi',   'Ponorogo'),
('Eko',    'Madiun'),
('Fitri',  'Sumenep'),
('Gilang', 'Surabaya'),
('Hana',   'Ponorogo');   -- Hana sengaja belum punya transaksi

-- =====================================================
-- C. FUNCTION (menghitung total dan diskon)
-- =====================================================
DELIMITER //

CREATE FUNCTION HitungTotal(harga DECIMAL(12,2), jumlah INT)
RETURNS DECIMAL(12,2)
DETERMINISTIC
NO SQL
BEGIN
    RETURN harga * jumlah;
END //

-- diskon dalam persen, hasil = nilai potongan (rupiah)
CREATE FUNCTION HitungDiskon(harga DECIMAL(12,2), diskon DECIMAL(5,2))
RETURNS DECIMAL(12,2)
DETERMINISTIC
NO SQL
BEGIN
    RETURN harga * diskon / 100;
END //

-- =====================================================
-- D. TRIGGER (audit perubahan data)
-- =====================================================

-- Mencatat setiap transaksi baru
CREATE TRIGGER after_insert_transaksi
AFTER INSERT ON tbl_transaksi
FOR EACH ROW
BEGIN
    INSERT INTO tbl_log (tabel, aktivitas, keterangan)
    VALUES ('tbl_transaksi', 'INSERT',
            CONCAT('Transaksi #', NEW.id_transaksi, ' untuk pelanggan ', NEW.id_pelanggan));
END //

-- Mencatat perubahan harga dan stok produk
CREATE TRIGGER after_update_produk
AFTER UPDATE ON tbl_produk
FOR EACH ROW
BEGIN
    IF OLD.harga <> NEW.harga THEN
        INSERT INTO tbl_log (tabel, aktivitas, keterangan)
        VALUES ('tbl_produk', 'UPDATE HARGA',
                CONCAT(NEW.nama_produk, ': ', OLD.harga, ' -> ', NEW.harga));
    END IF;
    IF OLD.stok <> NEW.stok THEN
        INSERT INTO tbl_log (tabel, aktivitas, keterangan)
        VALUES ('tbl_produk', 'UPDATE STOK',
                CONCAT(NEW.nama_produk, ': ', OLD.stok, ' -> ', NEW.stok));
    END IF;
END //

-- Validasi detail transaksi
CREATE TRIGGER before_insert_detail
BEFORE INSERT ON tbl_detail_transaksi
FOR EACH ROW
BEGIN
    IF NEW.jumlah <= 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Jumlah barang harus lebih dari 0';
    END IF;
END //

-- =====================================================
-- E. STORED PROCEDURE (proses tambah transaksi)
-- =====================================================

-- 1) Membuat transaksi baru (header), id-nya dikembalikan lewat OUT
CREATE PROCEDURE TambahTransaksi(
    IN  p_id_pelanggan INT,
    IN  p_tanggal DATE,
    OUT p_id_transaksi INT
)
BEGIN
    INSERT INTO tbl_transaksi (tanggal, id_pelanggan)
    VALUES (COALESCE(p_tanggal, CURDATE()), p_id_pelanggan);
    SET p_id_transaksi = LAST_INSERT_ID();
END //

-- 2) Menambah barang ke transaksi, memakai TCL:
--    semua langkah berhasil -> COMMIT, ada yang gagal -> ROLLBACK
CREATE PROCEDURE TambahDetailTransaksi(
    IN p_id_transaksi INT,
    IN p_id_produk INT,
    IN p_jumlah INT,
    IN p_diskon DECIMAL(5,2)
)
BEGIN
    DECLARE v_harga DECIMAL(12,2);
    DECLARE v_stok INT;
    DECLARE v_kotor DECIMAL(12,2);
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    SELECT harga, stok INTO v_harga, v_stok
    FROM tbl_produk
    WHERE id_produk = p_id_produk
    FOR UPDATE;

    IF v_harga IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Produk tidak ditemukan';
    END IF;
    IF v_stok < p_jumlah THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Stok tidak mencukupi';
    END IF;

    SET v_kotor = HitungTotal(v_harga, p_jumlah);

    INSERT INTO tbl_detail_transaksi
        (id_transaksi, id_produk, jumlah, harga, diskon_persen, subtotal)
    VALUES
        (p_id_transaksi, p_id_produk, p_jumlah, v_harga, p_diskon,
         v_kotor - HitungDiskon(v_kotor, p_diskon));

    UPDATE tbl_produk SET stok = stok - p_jumlah WHERE id_produk = p_id_produk;

    UPDATE tbl_transaksi
    SET total_belanja = (SELECT SUM(subtotal) FROM tbl_detail_transaksi
                         WHERE id_transaksi = p_id_transaksi)
    WHERE id_transaksi = p_id_transaksi;

    COMMIT;
END //

DELIMITER ;

-- =====================================================
-- F. DATA TRANSAKSI (diisi lewat procedure)
-- =====================================================
CALL TambahTransaksi(1, '2026-10-01', @t); CALL TambahDetailTransaksi(@t, 1, 2, 0);
                                           CALL TambahDetailTransaksi(@t, 3, 3, 5);
CALL TambahTransaksi(2, '2026-10-02', @t); CALL TambahDetailTransaksi(@t, 10, 2, 10);
CALL TambahTransaksi(1, '2026-10-03', @t); CALL TambahDetailTransaksi(@t, 4, 5, 0);
CALL TambahTransaksi(3, '2026-10-04', @t); CALL TambahDetailTransaksi(@t, 2, 4, 0);
                                           CALL TambahDetailTransaksi(@t, 9, 2, 0);
CALL TambahTransaksi(4, '2026-10-05', @t); CALL TambahDetailTransaksi(@t, 6, 3, 0);
CALL TambahTransaksi(5, '2026-10-06', @t); CALL TambahDetailTransaksi(@t, 1, 1, 0);
                                           CALL TambahDetailTransaksi(@t, 5, 20, 0);
CALL TambahTransaksi(6, '2026-10-07', @t); CALL TambahDetailTransaksi(@t, 7, 6, 5);
CALL TambahTransaksi(7, '2026-10-08', @t); CALL TambahDetailTransaksi(@t, 10, 1, 0);
                                           CALL TambahDetailTransaksi(@t, 8, 10, 0);
CALL TambahTransaksi(2, '2026-10-09', @t); CALL TambahDetailTransaksi(@t, 2, 2, 0);
CALL TambahTransaksi(3, '2026-10-10', @t); CALL TambahDetailTransaksi(@t, 1, 3, 10);
CALL TambahTransaksi(4, '2026-10-11', @t); CALL TambahDetailTransaksi(@t, 9, 1, 0);
CALL TambahTransaksi(5, '2026-10-12', @t); CALL TambahDetailTransaksi(@t, 3, 5, 0);

-- Log dari data awal dibersihkan agar log pengujian mulai dari kosong
TRUNCATE TABLE tbl_log;

-- =====================================================
-- G. VIEW (laporan penjualan)
-- =====================================================
CREATE VIEW view_laporan_penjualan AS
SELECT
    t.id_transaksi,
    t.tanggal,
    p.nama_pelanggan,
    p.kota,
    k.nama_kategori,
    pr.nama_produk,
    d.jumlah,
    d.harga,
    d.diskon_persen,
    d.subtotal
FROM tbl_transaksi t
JOIN tbl_pelanggan p        ON t.id_pelanggan = p.id_pelanggan
JOIN tbl_detail_transaksi d ON t.id_transaksi = d.id_transaksi
JOIN tbl_produk pr          ON d.id_produk = pr.id_produk
JOIN tbl_kategori k         ON pr.id_kategori = k.id_kategori;

CREATE VIEW view_total_belanja AS
SELECT
    p.id_pelanggan,
    p.nama_pelanggan,
    COUNT(t.id_transaksi) AS total_transaksi,
    COALESCE(SUM(t.total_belanja), 0) AS total_belanja
FROM tbl_pelanggan p
LEFT JOIN tbl_transaksi t ON p.id_pelanggan = t.id_pelanggan
GROUP BY p.id_pelanggan, p.nama_pelanggan;

-- =====================================================
-- H. INDEX (optimasi query)
-- =====================================================
-- (kolom id_pelanggan dan id_produk sudah otomatis diberi index oleh FOREIGN KEY)
CREATE INDEX idx_transaksi_tanggal ON tbl_transaksi(tanggal);
CREATE INDEX idx_produk_nama ON tbl_produk(nama_produk);
CREATE INDEX idx_pelanggan_kota ON tbl_pelanggan(kota);
SHOW INDEX FROM tbl_transaksi;

-- =====================================================
-- PENGUJIAN AKHIR (untuk screenshot)
-- =====================================================

-- 1. View dapat menampilkan laporan
SELECT * FROM view_laporan_penjualan;
SELECT * FROM view_total_belanja;

-- 2. JOIN menggabungkan beberapa tabel (5 tabel)
SELECT p.nama_pelanggan, t.tanggal, k.nama_kategori, pr.nama_produk, d.jumlah, d.subtotal
FROM tbl_pelanggan p
INNER JOIN tbl_transaksi t        ON p.id_pelanggan = t.id_pelanggan
INNER JOIN tbl_detail_transaksi d ON t.id_transaksi = d.id_transaksi
INNER JOIN tbl_produk pr          ON d.id_produk = pr.id_produk
INNER JOIN tbl_kategori k         ON pr.id_kategori = k.id_kategori
ORDER BY t.tanggal;

-- 3. Subquery menghasilkan analisis data
-- 3a. Transaksi bernilai di atas rata-rata
SELECT * FROM tbl_transaksi
WHERE total_belanja > (SELECT AVG(total_belanja) FROM tbl_transaksi);
-- 3b. Pelanggan yang belum pernah bertransaksi
SELECT * FROM tbl_pelanggan p
WHERE NOT EXISTS (SELECT 1 FROM tbl_transaksi t WHERE t.id_pelanggan = p.id_pelanggan);
-- 3c. Produk dengan harga di atas rata-rata
SELECT nama_produk, harga FROM tbl_produk
WHERE harga > (SELECT AVG(harga) FROM tbl_produk);

-- 4. Stored Procedure dapat dipanggil
CALL TambahTransaksi(8, '2026-11-16', @id_baru);
SELECT @id_baru AS id_transaksi_baru;
CALL TambahDetailTransaksi(@id_baru, 1, 2, 5);
CALL TambahDetailTransaksi(@id_baru, 6, 1, 0);
SELECT * FROM tbl_transaksi WHERE id_transaksi = @id_baru;
SELECT * FROM tbl_detail_transaksi WHERE id_transaksi = @id_baru;
SELECT id_produk, nama_produk, stok FROM tbl_produk WHERE id_produk IN (1, 6);

-- 5. Function menghasilkan perhitungan yang benar
SELECT HitungTotal(65000, 2)           AS total_kotor,      -- 130000
       HitungDiskon(130000, 5)         AS potongan_diskon,  -- 6500
       HitungTotal(65000, 2) - HitungDiskon(HitungTotal(65000, 2), 5) AS total_bayar; -- 123500

-- 6. Trigger berjalan otomatis
SELECT * FROM tbl_log;                          -- log dari transaksi baru di atas
UPDATE tbl_produk SET harga = 67000 WHERE id_produk = 1;
SELECT * FROM tbl_log ORDER BY id_log DESC LIMIT 3;
-- validasi: stok tidak cukup harus ditolak procedure (ROLLBACK otomatis)
CALL TambahDetailTransaksi(@id_baru, 10, 999, 0);
-- validasi: jumlah 0 harus ditolak trigger
CALL TambahDetailTransaksi(@id_baru, 1, 0, 0);

-- 7. Transaksi database dapat di-COMMIT dan di-ROLLBACK
-- 7a. ROLLBACK : perubahan dibatalkan
SELECT nama_produk, stok FROM tbl_produk WHERE id_produk = 5;
START TRANSACTION;
UPDATE tbl_produk SET stok = stok - 50 WHERE id_produk = 5;
SELECT nama_produk, stok FROM tbl_produk WHERE id_produk = 5;   -- stok berkurang 50
ROLLBACK;
SELECT nama_produk, stok FROM tbl_produk WHERE id_produk = 5;   -- kembali seperti semula
-- 7b. COMMIT : perubahan disimpan permanen
START TRANSACTION;
INSERT INTO tbl_pelanggan (nama_pelanggan, kota) VALUES ('Indah', 'Madiun');
COMMIT;
SELECT * FROM tbl_pelanggan WHERE nama_pelanggan = 'Indah';

-- 8. Query dianalisis menggunakan EXPLAIN
EXPLAIN SELECT * FROM tbl_transaksi WHERE tanggal = '2026-10-05';
EXPLAIN SELECT * FROM tbl_transaksi USE INDEX () WHERE tanggal = '2026-10-05';   -- tanpa index (pembanding)
EXPLAIN SELECT p.nama_pelanggan, t.total_belanja
FROM tbl_pelanggan p JOIN tbl_transaksi t ON p.id_pelanggan = t.id_pelanggan
WHERE p.kota = 'Ponorogo';
