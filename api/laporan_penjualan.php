<?php

declare(strict_types=1);

require_once __DIR__ . '/config.php';
wajibLogin();

/**
 * Mengambil parameter filter berupa teks dari query string.
 */
function ambilFilterTeks(string $kunci): ?string
{
    if (!isset($_GET[$kunci])) {
        return null;
    }

    $nilai = $_GET[$kunci];

    if (!is_string($nilai)) {
        kirimError('Parameter filter tidak valid.', 400);
    }

    $teks = trim($nilai);

    return $teks === '' ? null : $teks;
}

/**
 * Memvalidasi tanggal filter berformat Y-m-d.
 */
function validasiTanggalFilter(?string $nilai, string $label): ?string
{
    if ($nilai === null) {
        return null;
    }

    $tanggal = DateTimeImmutable::createFromFormat('!Y-m-d', $nilai);

    if ($tanggal === false || $tanggal->format('Y-m-d') !== $nilai) {
        kirimError(
            sprintf('Tanggal %s tidak valid. Gunakan format YYYY-MM-DD.', $label),
            400
        );
    }

    return $nilai;
}

$metode = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($metode !== 'GET') {
    header('Allow: GET');
    kirimError('Metode tidak diizinkan.', 405);
}

try {
    $dari = validasiTanggalFilter(ambilFilterTeks('dari'), 'awal');
    $sampai = validasiTanggalFilter(ambilFilterTeks('sampai'), 'akhir');
    $kota = ambilFilterTeks('kota');

    if ($dari !== null && $sampai !== null && $dari > $sampai) {
        kirimError('Tanggal awal tidak boleh melebihi tanggal akhir.', 400);
    }

    $kondisi = [];
    $parameter = [];

    if ($dari !== null) {
        $kondisi[] = 'tanggal >= :dari';
        $parameter[':dari'] = $dari;
    }

    if ($sampai !== null) {
        $kondisi[] = 'tanggal <= :sampai';
        $parameter[':sampai'] = $sampai;
    }

    if ($kota !== null) {
        $kondisi[] = 'kota = :kota';
        $parameter[':kota'] = $kota;
    }

    $where = $kondisi === [] ? '' : ' WHERE ' . implode(' AND ', $kondisi);

    // Seluruh data laporan diambil langsung dari view, tanpa menulis ulang JOIN.
    $stmt = $pdo->prepare(
        'SELECT id_transaksi, tanggal, nama_pelanggan, kota, nama_kategori,
                nama_produk, jumlah, harga, diskon_persen, subtotal
         FROM view_laporan_penjualan' . $where . '
         ORDER BY tanggal ASC, id_transaksi ASC, nama_produk ASC'
    );
    $stmt->execute($parameter);

    $data = array_map(
        static fn (array $baris): array => [
            'id_transaksi'   => (int) $baris['id_transaksi'],
            'tanggal'        => $baris['tanggal'],
            'nama_pelanggan' => $baris['nama_pelanggan'],
            'kota'           => $baris['kota'],
            'nama_kategori'  => $baris['nama_kategori'],
            'nama_produk'    => $baris['nama_produk'],
            'jumlah'         => (int) $baris['jumlah'],
            'harga'          => (float) $baris['harga'],
            'diskon_persen'  => (float) $baris['diskon_persen'],
            'subtotal'       => (float) $baris['subtotal'],
        ],
        $stmt->fetchAll()
    );

    // Ringkasan dihitung dari view yang sama dengan filter yang sama.
    $stmt = $pdo->prepare(
        'SELECT COUNT(*) AS jumlah_baris,
                COUNT(DISTINCT id_transaksi) AS jumlah_transaksi,
                COALESCE(SUM(subtotal), 0) AS total_penjualan
         FROM view_laporan_penjualan' . $where
    );
    $stmt->execute($parameter);
    $ringkasan = $stmt->fetch();

    // Daftar kota untuk pilihan filter, tetap dari view.
    $stmt = $pdo->prepare(
        'SELECT DISTINCT kota FROM view_laporan_penjualan ORDER BY kota ASC'
    );
    $stmt->execute();
    $daftarKota = array_map('strval', $stmt->fetchAll(PDO::FETCH_COLUMN));

    kirimJson([
        'data'      => $data,
        'ringkasan' => [
            'jumlah_baris'     => (int) ($ringkasan['jumlah_baris'] ?? 0),
            'jumlah_transaksi' => (int) ($ringkasan['jumlah_transaksi'] ?? 0),
            'total_penjualan'  => (float) ($ringkasan['total_penjualan'] ?? 0),
        ],
        'filter'    => [
            'dari'   => $dari,
            'sampai' => $sampai,
            'kota'   => $kota,
        ],
        'kota'      => $daftarKota,
    ]);
} catch (Throwable $e) {
    error_log('Gagal memuat laporan penjualan: ' . $e->getMessage());
    kirimError('Terjadi kesalahan pada server.', 500);
}
