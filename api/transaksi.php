<?php

declare(strict_types=1);

require_once __DIR__ . '/config.php';
wajibLogin();

/**
 * Membaca body JSON dan mengembalikan array asosiatif.
 */
function bacaBodyJson(): array
{
    $body = file_get_contents('php://input');

    if ($body === false || trim($body) === '') {
        return [];
    }

    $data = json_decode($body, true);

    if (!is_array($data)) {
        kirimError('Data yang dikirim tidak valid.', 400);
    }

    return $data;
}

/**
 * Mengambil id dari query string ?id= dan memastikan berupa bilangan bulat positif.
 */
function ambilIdTransaksi(): int
{
    $id = filter_var($_GET['id'] ?? null, FILTER_VALIDATE_INT);

    if ($id === false || $id === null || $id < 1) {
        kirimError('ID transaksi tidak valid.', 400);
    }

    return $id;
}

/**
 * Memvalidasi tanggal dan mengembalikan format Y-m-d.
 */
function validasiTanggal(mixed $nilai): string
{
    $teks = trim((string) $nilai);

    if ($teks === '') {
        return date('Y-m-d');
    }

    $tanggal = DateTimeImmutable::createFromFormat('!Y-m-d', $teks);

    if (
        $tanggal === false ||
        $tanggal->format('Y-m-d') !== $teks
    ) {
        kirimError('Tanggal tidak valid.', 400);
    }

    return $teks;
}

/**
 * Mengubah tipe data hasil query daftar transaksi agar konsisten di JSON.
 */
function formatTransaksi(array $baris): array
{
    return [
        'id_transaksi'   => (int) $baris['id_transaksi'],
        'tanggal'        => $baris['tanggal'],
        'id_pelanggan'   => (int) $baris['id_pelanggan'],
        'nama_pelanggan' => $baris['nama_pelanggan'],
        'jumlah_item'    => (int) $baris['jumlah_item'],
        'total_belanja'  => (float) $baris['total_belanja'],
    ];
}

/**
 * Mengambil satu transaksi beserta seluruh barangnya.
 */
function ambilDetailTransaksi(PDO $pdo, int $id): ?array
{
    $stmt = $pdo->prepare(
        'SELECT t.id_transaksi, t.tanggal, t.id_pelanggan, p.nama_pelanggan,
                p.kota, t.total_belanja
         FROM tbl_transaksi AS t
         INNER JOIN tbl_pelanggan AS p ON p.id_pelanggan = t.id_pelanggan
         WHERE t.id_transaksi = :id'
    );
    $stmt->bindValue(':id', $id, PDO::PARAM_INT);
    $stmt->execute();

    $kepala = $stmt->fetch();

    if ($kepala === false) {
        return null;
    }

    $stmt = $pdo->prepare(
        'SELECT d.id_detail, d.id_produk, pr.nama_produk, k.nama_kategori,
                d.jumlah, d.harga, d.diskon_persen, d.subtotal
         FROM tbl_detail_transaksi AS d
         INNER JOIN tbl_produk AS pr ON pr.id_produk = d.id_produk
         INNER JOIN tbl_kategori AS k ON k.id_kategori = pr.id_kategori
         WHERE d.id_transaksi = :id
         ORDER BY d.id_detail ASC'
    );
    $stmt->bindValue(':id', $id, PDO::PARAM_INT);
    $stmt->execute();

    $items = array_map(
        static fn (array $baris): array => [
            'id_detail'     => (int) $baris['id_detail'],
            'id_produk'     => (int) $baris['id_produk'],
            'nama_produk'   => $baris['nama_produk'],
            'nama_kategori' => $baris['nama_kategori'],
            'jumlah'        => (int) $baris['jumlah'],
            'harga'         => (float) $baris['harga'],
            'diskon_persen' => (float) $baris['diskon_persen'],
            'subtotal'      => (float) $baris['subtotal'],
        ],
        $stmt->fetchAll()
    );

    return [
        'id_transaksi'   => (int) $kepala['id_transaksi'],
        'tanggal'        => $kepala['tanggal'],
        'id_pelanggan'   => (int) $kepala['id_pelanggan'],
        'nama_pelanggan' => $kepala['nama_pelanggan'],
        'kota'           => $kepala['kota'],
        'total_belanja'  => (float) $kepala['total_belanja'],
        'items'          => $items,
    ];
}

/**
 * Mengambil pesan error yang berasal dari database.
 */
function pesanDatabase(PDOException $e): string
{
    $pesan = trim((string) ($e->errorInfo[2] ?? ''));

    if ($pesan !== '') {
        return $pesan;
    }

    $pesan = preg_replace(
        '/^SQLSTATE\[[^\]]+\][^:]*:\s*\d*\s*/',
        '',
        $e->getMessage()
    );

    $pesan = trim((string) $pesan);

    return $pesan !== '' ? $pesan : 'Transaksi gagal disimpan.';
}

$metode = $_SERVER['REQUEST_METHOD'] ?? 'GET';

try {
    if ($metode === 'GET') {
        if (isset($_GET['id'])) {
            $id = ambilIdTransaksi();
            $transaksi = ambilDetailTransaksi($pdo, $id);

            if ($transaksi === null) {
                kirimError('Transaksi tidak ditemukan.', 404);
            }

            kirimJson(['data' => $transaksi]);
        }

        $stmt = $pdo->prepare(
            'SELECT t.id_transaksi, t.tanggal, t.id_pelanggan, p.nama_pelanggan,
                    t.total_belanja,
                    (SELECT COUNT(*)
                     FROM tbl_detail_transaksi AS d
                     WHERE d.id_transaksi = t.id_transaksi) AS jumlah_item
             FROM tbl_transaksi AS t
             INNER JOIN tbl_pelanggan AS p ON p.id_pelanggan = t.id_pelanggan
             ORDER BY t.tanggal DESC, t.id_transaksi DESC'
        );
        $stmt->execute();

        $daftar = array_map('formatTransaksi', $stmt->fetchAll());

        kirimJson(['data' => $daftar]);
    }

    if ($metode === 'POST') {
        $input = bacaBodyJson();

        $idPelanggan = filter_var(
            $input['id_pelanggan'] ?? null,
            FILTER_VALIDATE_INT
        );

        if ($idPelanggan === false || $idPelanggan === null || $idPelanggan < 1) {
            kirimError('Pelanggan wajib dipilih.', 400);
        }

        $stmt = $pdo->prepare(
            'SELECT COUNT(*) FROM tbl_pelanggan WHERE id_pelanggan = :id'
        );
        $stmt->bindValue(':id', $idPelanggan, PDO::PARAM_INT);
        $stmt->execute();

        if ((int) $stmt->fetchColumn() === 0) {
            kirimError('Pelanggan tidak ditemukan.', 400);
        }

        $tanggal = validasiTanggal($input['tanggal'] ?? '');

        $items = $input['items'] ?? null;

        if (!is_array($items) || !array_is_list($items) || $items === []) {
            kirimError('Minimal satu barang harus ditambahkan.', 400);
        }

        $baris = [];

        foreach ($items as $item) {
            if (!is_array($item)) {
                kirimError('Data barang tidak valid.', 400);
            }

            $idProduk = filter_var(
                $item['id_produk'] ?? null,
                FILTER_VALIDATE_INT
            );

            if ($idProduk === false || $idProduk === null || $idProduk < 1) {
                kirimError('Produk pada daftar barang tidak valid.', 400);
            }

            $jumlah = filter_var(
                $item['jumlah'] ?? null,
                FILTER_VALIDATE_INT
            );

            if ($jumlah === false || $jumlah === null || $jumlah < 1) {
                kirimError('Jumlah barang harus berupa bilangan bulat lebih dari 0.', 400);
            }

            $diskonMentah = $item['diskon_persen'] ?? 0;

            if (
                $diskonMentah === '' ||
                !is_numeric($diskonMentah) ||
                (float) $diskonMentah < 0 ||
                (float) $diskonMentah > 100
            ) {
                kirimError('Diskon harus berupa angka antara 0 sampai 100.', 400);
            }

            $baris[] = [
                'id_produk'     => $idProduk,
                'jumlah'        => $jumlah,
                'diskon_persen' => round((float) $diskonMentah, 2),
            ];
        }

        // Periksa stok seluruh barang lebih dulu, termasuk bila produk yang sama
        // muncul pada lebih dari satu baris.
        $kebutuhan = [];

        foreach ($baris as $item) {
            $kebutuhan[$item['id_produk']] =
                ($kebutuhan[$item['id_produk']] ?? 0) + $item['jumlah'];
        }

        foreach ($kebutuhan as $idProduk => $totalJumlah) {
            $stmt = $pdo->prepare(
                'SELECT nama_produk, stok FROM tbl_produk WHERE id_produk = :id'
            );
            $stmt->bindValue(':id', $idProduk, PDO::PARAM_INT);
            $stmt->execute();

            $produk = $stmt->fetch();

            if ($produk === false) {
                kirimError(
                    'Ada produk pada daftar barang yang tidak ditemukan.',
                    400
                );
            }

            if ((int) $produk['stok'] < $totalJumlah) {
                kirimError(
                    sprintf(
                        'Stok tidak mencukupi untuk produk "%s". Stok tersedia %d.',
                        $produk['nama_produk'],
                        (int) $produk['stok']
                    ),
                    422
                );
            }
        }

        try {
            $stmt = $pdo->prepare(
                'CALL TambahTransaksi(:id_pelanggan, :tanggal, @id_transaksi)'
            );
            $stmt->bindValue(':id_pelanggan', $idPelanggan, PDO::PARAM_INT);
            $stmt->bindValue(':tanggal', $tanggal, PDO::PARAM_STR);
            $stmt->execute();
            $stmt->closeCursor();

            $stmt = $pdo->prepare('SELECT @id_transaksi');
            $stmt->execute();
            $idTransaksi = (int) $stmt->fetchColumn();
            $stmt->closeCursor();

            if ($idTransaksi < 1) {
                throw new RuntimeException('ID transaksi baru tidak terbaca.');
            }

            foreach ($baris as $item) {
                $stmt = $pdo->prepare(
                    'CALL TambahDetailTransaksi(:id_transaksi, :id_produk, :jumlah, :diskon)'
                );
                $stmt->bindValue(':id_transaksi', $idTransaksi, PDO::PARAM_INT);
                $stmt->bindValue(':id_produk', $item['id_produk'], PDO::PARAM_INT);
                $stmt->bindValue(':jumlah', $item['jumlah'], PDO::PARAM_INT);
                $stmt->bindValue(':diskon', $item['diskon_persen']);
                $stmt->execute();
                $stmt->closeCursor();
            }
        } catch (PDOException $e) {
            kirimError(pesanDatabase($e), 422);
        }

        kirimJson([
            'message' => 'Transaksi berhasil disimpan.',
            'data'    => ambilDetailTransaksi($pdo, $idTransaksi),
        ], 201);
    }

    header('Allow: GET, POST');
    kirimError('Metode tidak diizinkan.', 405);
} catch (Throwable $e) {
    error_log('Gagal memproses data transaksi: ' . $e->getMessage());
    kirimError('Terjadi kesalahan pada server.', 500);
}
