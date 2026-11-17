<?php

declare(strict_types=1);

require_once __DIR__ . '/config.php';
wajibLogin();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    header('Allow: GET');
    kirimError('Metode tidak diizinkan.', 405);
}

try {
    $stmt = $pdo->prepare('SELECT COUNT(*) FROM tbl_pelanggan');
    $stmt->execute();
    $jumlahPelanggan = (int) $stmt->fetchColumn();

    $stmt = $pdo->prepare('SELECT COUNT(*) FROM tbl_produk');
    $stmt->execute();
    $jumlahProduk = (int) $stmt->fetchColumn();

    $stmt = $pdo->prepare('SELECT COUNT(*) FROM tbl_transaksi');
    $stmt->execute();
    $jumlahTransaksi = (int) $stmt->fetchColumn();

    $stmt = $pdo->prepare('SELECT COALESCE(SUM(total_belanja), 0) FROM tbl_transaksi');
    $stmt->execute();
    $totalPenjualan = (float) $stmt->fetchColumn();

    $stmt = $pdo->prepare(
        'SELECT tanggal, COALESCE(SUM(total_belanja), 0) AS total
         FROM tbl_transaksi
         GROUP BY tanggal
         ORDER BY tanggal ASC'
    );
    $stmt->execute();
    $penjualanPerTanggal = array_map(
        static fn (array $baris): array => [
            'tanggal' => $baris['tanggal'],
            'total'   => (float) $baris['total'],
        ],
        $stmt->fetchAll()
    );

    $stmt = $pdo->prepare(
        'SELECT t.id_transaksi, t.tanggal, p.nama_pelanggan, t.total_belanja
         FROM tbl_transaksi AS t
         INNER JOIN tbl_pelanggan AS p ON p.id_pelanggan = t.id_pelanggan
         ORDER BY t.tanggal DESC, t.id_transaksi DESC
         LIMIT 5'
    );
    $stmt->execute();
    $transaksiTerbaru = array_map(
        static fn (array $baris): array => [
            'id_transaksi'   => (int) $baris['id_transaksi'],
            'tanggal'        => $baris['tanggal'],
            'nama_pelanggan' => $baris['nama_pelanggan'],
            'total_belanja'  => (float) $baris['total_belanja'],
        ],
        $stmt->fetchAll()
    );

    kirimJson([
        'jumlah_pelanggan'    => $jumlahPelanggan,
        'jumlah_produk'       => $jumlahProduk,
        'jumlah_transaksi'    => $jumlahTransaksi,
        'total_penjualan'     => $totalPenjualan,
        'penjualan_per_tanggal' => $penjualanPerTanggal,
        'transaksi_terbaru'   => $transaksiTerbaru,
    ]);
} catch (Throwable $e) {
    error_log('Gagal memuat dashboard: ' . $e->getMessage());
    kirimError('Gagal memuat data dashboard.', 500);
}
