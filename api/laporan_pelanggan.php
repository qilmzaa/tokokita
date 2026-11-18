<?php

declare(strict_types=1);

require_once __DIR__ . '/config.php';
wajibPeran(['Admin']);

$metode = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($metode !== 'GET') {
    header('Allow: GET');
    kirimError('Metode tidak diizinkan.', 405);
}

try {
    // Rekap belanja pelanggan diambil langsung dari view, terbesar lebih dulu.
    $stmt = $pdo->prepare(
        'SELECT id_pelanggan, nama_pelanggan, total_transaksi, total_belanja
         FROM view_total_belanja
         ORDER BY total_belanja DESC, nama_pelanggan ASC'
    );
    $stmt->execute();

    $data = array_map(
        static fn (array $baris): array => [
            'id_pelanggan'    => (int) $baris['id_pelanggan'],
            'nama_pelanggan'  => $baris['nama_pelanggan'],
            'total_transaksi' => (int) $baris['total_transaksi'],
            'total_belanja'   => (float) $baris['total_belanja'],
        ],
        $stmt->fetchAll()
    );

    kirimJson(['data' => $data]);
} catch (Throwable $e) {
    error_log('Gagal memuat laporan pelanggan: ' . $e->getMessage());
    kirimError('Terjadi kesalahan pada server.', 500);
}
