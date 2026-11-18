<?php

declare(strict_types=1);

require_once __DIR__ . '/config.php';
wajibPeran(['Admin']);

/**
 * Mengambil parameter bilangan bulat dari query string beserta batasnya.
 */
function ambilBilangan(string $kunci, int $bawaan, int $minimum, int $maksimum): int
{
    if (!isset($_GET[$kunci]) || $_GET[$kunci] === '') {
        return $bawaan;
    }

    if (!is_string($_GET[$kunci])) {
        kirimError('Parameter halaman tidak valid.', 400);
    }

    $nilai = filter_var($_GET[$kunci], FILTER_VALIDATE_INT);

    if ($nilai === false || $nilai < $minimum || $nilai > $maksimum) {
        kirimError(
            sprintf(
                'Parameter %s harus bilangan bulat antara %d sampai %d.',
                $kunci,
                $minimum,
                $maksimum
            ),
            400
        );
    }

    return $nilai;
}

/**
 * Mengambil filter nama tabel. Nilai kosong berarti semua tabel.
 */
function ambilFilterTabel(): ?string
{
    if (!isset($_GET['tabel'])) {
        return null;
    }

    if (!is_string($_GET['tabel'])) {
        kirimError('Parameter tabel tidak valid.', 400);
    }

    $teks = trim($_GET['tabel']);

    return $teks === '' ? null : $teks;
}

$metode = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($metode !== 'GET') {
    header('Allow: GET');
    kirimError('Metode tidak diizinkan.', 405);
}

try {
    $halaman = ambilBilangan('page', 1, 1, 1_000_000);
    $perHalaman = ambilBilangan('per_page', 20, 1, 100);
    $tabel = ambilFilterTabel();

    $where = $tabel === null ? '' : ' WHERE tabel = :tabel';
    $parameter = $tabel === null ? [] : [':tabel' => $tabel];

    $stmt = $pdo->prepare('SELECT COUNT(*) FROM tbl_log' . $where);
    $stmt->execute($parameter);
    $total = (int) $stmt->fetchColumn();

    $totalHalaman = $total === 0 ? 0 : (int) ceil($total / $perHalaman);
    $offset = ($halaman - 1) * $perHalaman;

    $stmt = $pdo->prepare(
        'SELECT id_log, tabel, aktivitas, keterangan, waktu
         FROM tbl_log' . $where . '
         ORDER BY waktu DESC, id_log DESC
         LIMIT :limit OFFSET :offset'
    );

    if ($tabel !== null) {
        $stmt->bindValue(':tabel', $tabel, PDO::PARAM_STR);
    }

    $stmt->bindValue(':limit', $perHalaman, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();

    $data = array_map(
        static fn (array $baris): array => [
            'id_log'     => (int) $baris['id_log'],
            'tabel'      => $baris['tabel'],
            'aktivitas'  => $baris['aktivitas'],
            'keterangan' => $baris['keterangan'],
            'waktu'      => $baris['waktu'],
        ],
        $stmt->fetchAll()
    );

    // Pilihan filter diambil dari tabel log yang sama.
    $stmt = $pdo->prepare(
        'SELECT DISTINCT tabel FROM tbl_log
         WHERE tabel IS NOT NULL AND tabel <> \'\'
         ORDER BY tabel ASC'
    );
    $stmt->execute();
    $daftarTabel = array_map('strval', $stmt->fetchAll(PDO::FETCH_COLUMN));

    kirimJson([
        'data'       => $data,
        'pagination' => [
            'page'          => $halaman,
            'per_page'      => $perHalaman,
            'total'         => $total,
            'total_halaman' => $totalHalaman,
        ],
        'tabel'      => $daftarTabel,
    ]);
} catch (Throwable $e) {
    error_log('Gagal memuat log: ' . $e->getMessage());
    kirimError('Terjadi kesalahan pada server.', 500);
}
