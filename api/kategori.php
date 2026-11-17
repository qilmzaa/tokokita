<?php

declare(strict_types=1);

require_once __DIR__ . '/config.php';
wajibLogin();

$metode = $_SERVER['REQUEST_METHOD'] ?? 'GET';

try {
    if ($metode === 'GET') {
        $stmt = $pdo->prepare(
            'SELECT id_kategori, nama_kategori
             FROM tbl_kategori
             ORDER BY nama_kategori ASC'
        );
        $stmt->execute();

        $daftar = array_map(
            static fn (array $baris): array => [
                'id_kategori'   => (int) $baris['id_kategori'],
                'nama_kategori' => $baris['nama_kategori'],
            ],
            $stmt->fetchAll()
        );

        kirimJson(['data' => $daftar]);
    }

    header('Allow: GET');
    kirimError('Metode tidak diizinkan.', 405);
} catch (Throwable $e) {
    error_log('Gagal memproses data kategori: ' . $e->getMessage());
    kirimError('Terjadi kesalahan pada server.', 500);
}
