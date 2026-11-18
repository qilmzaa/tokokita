<?php

declare(strict_types=1);

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/pelanggan_sesi.php';

if (pelangganSaatIni() === null) {
    kirimError('Silakan masuk ke akun pelanggan terlebih dahulu.', 401);
}

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
    header('Allow: GET');
    kirimError('Metode tidak diizinkan.', 405);
}

try {
    $stmt = $pdo->prepare(
        'SELECT p.id_produk, p.nama_produk, p.id_kategori, k.nama_kategori,
                p.harga, p.stok, p.foto
         FROM tbl_produk AS p
         INNER JOIN tbl_kategori AS k ON k.id_kategori = p.id_kategori
         ORDER BY p.nama_produk ASC'
    );
    $stmt->execute();
    $data = array_map(
        static fn (array $baris): array => [
            'id_produk' => (int) $baris['id_produk'],
            'nama_produk' => $baris['nama_produk'],
            'id_kategori' => (int) $baris['id_kategori'],
            'nama_kategori' => $baris['nama_kategori'],
            'harga' => (float) $baris['harga'],
            'stok' => (int) $baris['stok'],
            'foto' => $baris['foto'] !== null ? (string) $baris['foto'] : null,
        ],
        $stmt->fetchAll()
    );

    kirimJson(['data' => $data]);
} catch (Throwable $e) {
    error_log('Gagal memuat katalog pelanggan: ' . $e->getMessage());
    kirimError('Terjadi kesalahan saat memuat katalog produk.', 500);
}
