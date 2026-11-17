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
function ambilIdPelanggan(): int
{
    $id = filter_var($_GET['id'] ?? null, FILTER_VALIDATE_INT);

    if ($id === false || $id === null || $id < 1) {
        kirimError('ID pelanggan tidak valid.', 400);
    }

    return $id;
}

/**
 * Mengubah tipe data hasil query agar konsisten di JSON.
 */
function formatPelanggan(array $baris): array
{
    return [
        'id_pelanggan'     => (int) $baris['id_pelanggan'],
        'nama_pelanggan'   => $baris['nama_pelanggan'],
        'kota'             => $baris['kota'],
        'jumlah_transaksi' => (int) $baris['jumlah_transaksi'],
        'total_belanja'    => (float) $baris['total_belanja'],
    ];
}

/**
 * Mengambil satu pelanggan beserta rekap transaksinya.
 */
function ambilPelanggan(PDO $pdo, int $id): ?array
{
    $stmt = $pdo->prepare(
        'SELECT p.id_pelanggan, p.nama_pelanggan, p.kota,
                COALESCE(v.total_transaksi, 0) AS jumlah_transaksi,
                COALESCE(v.total_belanja, 0) AS total_belanja
         FROM tbl_pelanggan AS p
         LEFT JOIN view_total_belanja AS v ON v.id_pelanggan = p.id_pelanggan
         WHERE p.id_pelanggan = :id'
    );
    $stmt->bindValue(':id', $id, PDO::PARAM_INT);
    $stmt->execute();

    $baris = $stmt->fetch();
    return $baris === false ? null : formatPelanggan($baris);
}

$metode = $_SERVER['REQUEST_METHOD'] ?? 'GET';

try {
    if ($metode === 'GET') {
        $cari = trim((string) ($_GET['q'] ?? ''));

        $sql = 'SELECT p.id_pelanggan, p.nama_pelanggan, p.kota,
                       COALESCE(v.total_transaksi, 0) AS jumlah_transaksi,
                       COALESCE(v.total_belanja, 0) AS total_belanja
                FROM tbl_pelanggan AS p
                LEFT JOIN view_total_belanja AS v ON v.id_pelanggan = p.id_pelanggan';

        if ($cari !== '') {
            $sql .= " WHERE p.nama_pelanggan LIKE :cari_nama
                         OR COALESCE(p.kota, '') LIKE :cari_kota";
        }

        $sql .= ' ORDER BY p.nama_pelanggan ASC';

        $stmt = $pdo->prepare($sql);

        if ($cari !== '') {
            $kataKunci = '%' . $cari . '%';
            $stmt->bindValue(':cari_nama', $kataKunci, PDO::PARAM_STR);
            $stmt->bindValue(':cari_kota', $kataKunci, PDO::PARAM_STR);
        }

        $stmt->execute();
        $daftar = array_map('formatPelanggan', $stmt->fetchAll());

        kirimJson(['data' => $daftar]);
    }

    if ($metode === 'POST') {
        $input = bacaBodyJson();
        $nama = trim((string) ($input['nama_pelanggan'] ?? ''));
        $kota = trim((string) ($input['kota'] ?? ''));

        if ($nama === '') {
            kirimError('Nama pelanggan wajib diisi.', 400);
        }
        if (mb_strlen($nama) > 100) {
            kirimError('Nama pelanggan maksimal 100 karakter.', 400);
        }
        if (mb_strlen($kota) > 50) {
            kirimError('Nama kota maksimal 50 karakter.', 400);
        }

        $stmt = $pdo->prepare(
            'INSERT INTO tbl_pelanggan (nama_pelanggan, kota)
             VALUES (:nama, :kota)'
        );
        $stmt->bindValue(':nama', $nama, PDO::PARAM_STR);
        $stmt->bindValue(
            ':kota',
            $kota === '' ? null : $kota,
            $kota === '' ? PDO::PARAM_NULL : PDO::PARAM_STR
        );
        $stmt->execute();

        $idBaru = (int) $pdo->lastInsertId();
        $pelanggan = ambilPelanggan($pdo, $idBaru);

        kirimJson([
            'message' => 'Pelanggan berhasil ditambahkan.',
            'data'    => $pelanggan,
        ], 201);
    }

    if ($metode === 'PUT') {
        $id = ambilIdPelanggan();
        $input = bacaBodyJson();
        $nama = trim((string) ($input['nama_pelanggan'] ?? ''));
        $kota = trim((string) ($input['kota'] ?? ''));

        if ($nama === '') {
            kirimError('Nama pelanggan wajib diisi.', 400);
        }
        if (mb_strlen($nama) > 100) {
            kirimError('Nama pelanggan maksimal 100 karakter.', 400);
        }
        if (mb_strlen($kota) > 50) {
            kirimError('Nama kota maksimal 50 karakter.', 400);
        }

        if (ambilPelanggan($pdo, $id) === null) {
            kirimError('Pelanggan tidak ditemukan.', 404);
        }

        $stmt = $pdo->prepare(
            'UPDATE tbl_pelanggan
             SET nama_pelanggan = :nama, kota = :kota
             WHERE id_pelanggan = :id'
        );
        $stmt->bindValue(':nama', $nama, PDO::PARAM_STR);
        $stmt->bindValue(
            ':kota',
            $kota === '' ? null : $kota,
            $kota === '' ? PDO::PARAM_NULL : PDO::PARAM_STR
        );
        $stmt->bindValue(':id', $id, PDO::PARAM_INT);
        $stmt->execute();

        kirimJson([
            'message' => 'Data pelanggan berhasil diperbarui.',
            'data'    => ambilPelanggan($pdo, $id),
        ]);
    }

    if ($metode === 'DELETE') {
        $id = ambilIdPelanggan();

        $stmt = $pdo->prepare(
            'SELECT COUNT(*) FROM tbl_transaksi WHERE id_pelanggan = :id'
        );
        $stmt->bindValue(':id', $id, PDO::PARAM_INT);
        $stmt->execute();
        $jumlahTransaksi = (int) $stmt->fetchColumn();

        if ($jumlahTransaksi > 0) {
            kirimError(
                'Pelanggan ini masih memiliki transaksi sehingga tidak dapat dihapus.',
                409
            );
        }

        $stmt = $pdo->prepare(
            'DELETE FROM tbl_pelanggan WHERE id_pelanggan = :id'
        );
        $stmt->bindValue(':id', $id, PDO::PARAM_INT);

        try {
            $stmt->execute();
        } catch (PDOException $e) {
            if ($e->getCode() === '23000') {
                kirimError(
                    'Pelanggan ini masih terkait dengan data transaksi sehingga tidak dapat dihapus.',
                    409
                );
            }
            throw $e;
        }

        if ($stmt->rowCount() === 0) {
            kirimError('Pelanggan tidak ditemukan.', 404);
        }

        kirimJson(['message' => 'Pelanggan berhasil dihapus.']);
    }

    header('Allow: GET, POST, PUT, DELETE');
    kirimError('Metode tidak diizinkan.', 405);
} catch (Throwable $e) {
    error_log('Gagal memproses data pelanggan: ' . $e->getMessage());
    kirimError('Terjadi kesalahan pada server.', 500);
}
