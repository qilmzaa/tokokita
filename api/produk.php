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
function ambilIdProduk(): int
{
    $id = filter_var($_GET['id'] ?? null, FILTER_VALIDATE_INT);

    if ($id === false || $id === null || $id < 1) {
        kirimError('ID produk tidak valid.', 400);
    }

    return $id;
}

/**
 * Mengubah tipe data hasil query agar konsisten di JSON.
 */
function formatProduk(array $baris): array
{
    return [
        'id_produk'     => (int) $baris['id_produk'],
        'nama_produk'   => $baris['nama_produk'],
        'id_kategori'   => (int) $baris['id_kategori'],
        'nama_kategori' => $baris['nama_kategori'],
        'harga'         => (float) $baris['harga'],
        'stok'          => (int) $baris['stok'],
    ];
}

/**
 * Mengambil satu produk beserta nama kategorinya.
 */
function ambilProduk(PDO $pdo, int $id): ?array
{
    $stmt = $pdo->prepare(
        'SELECT p.id_produk, p.nama_produk, p.id_kategori, k.nama_kategori,
                p.harga, p.stok
         FROM tbl_produk AS p
         INNER JOIN tbl_kategori AS k ON k.id_kategori = p.id_kategori
         WHERE p.id_produk = :id'
    );
    $stmt->bindValue(':id', $id, PDO::PARAM_INT);
    $stmt->execute();

    $baris = $stmt->fetch();
    return $baris === false ? null : formatProduk($baris);
}

/**
 * Memastikan kategori dengan id tersebut tersedia.
 */
function pastikanKategoriAda(PDO $pdo, int $idKategori): void
{
    $stmt = $pdo->prepare(
        'SELECT COUNT(*) FROM tbl_kategori WHERE id_kategori = :id'
    );
    $stmt->bindValue(':id', $idKategori, PDO::PARAM_INT);
    $stmt->execute();

    if ((int) $stmt->fetchColumn() === 0) {
        kirimError('Kategori yang dipilih tidak ditemukan.', 400);
    }
}

/**
 * Memvalidasi dan menormalkan input produk dari body JSON.
 */
function validasiProduk(array $input): array
{
    $nama = trim((string) ($input['nama_produk'] ?? ''));

    if ($nama === '') {
        kirimError('Nama produk wajib diisi.', 400);
    }
    if (mb_strlen($nama) > 100) {
        kirimError('Nama produk maksimal 100 karakter.', 400);
    }

    $idKategori = filter_var($input['id_kategori'] ?? null, FILTER_VALIDATE_INT);
    if ($idKategori === false || $idKategori === null || $idKategori < 1) {
        kirimError('Kategori wajib dipilih.', 400);
    }

    $hargaMentah = $input['harga'] ?? null;
    if (
        $hargaMentah === null ||
        $hargaMentah === '' ||
        !is_numeric($hargaMentah) ||
        (float) $hargaMentah < 0
    ) {
        kirimError('Harga harus berupa angka 0 atau lebih.', 400);
    }

    $harga = round((float) $hargaMentah, 2);
    if ($harga > 9999999999.99) {
        kirimError('Harga terlalu besar.', 400);
    }

    $stokMentah = $input['stok'] ?? null;
    if (
        $stokMentah === null ||
        $stokMentah === '' ||
        !is_numeric($stokMentah) ||
        (float) $stokMentah < 0 ||
        floor((float) $stokMentah) !== (float) $stokMentah
    ) {
        kirimError('Stok harus berupa bilangan bulat 0 atau lebih.', 400);
    }

    $stok = (int) $stokMentah;
    if ($stok > 2147483647) {
        kirimError('Stok terlalu besar.', 400);
    }

    return [
        'nama_produk' => $nama,
        'id_kategori' => (int) $idKategori,
        'harga'       => $harga,
        'stok'        => $stok,
    ];
}

$metode = $_SERVER['REQUEST_METHOD'] ?? 'GET';

try {
    if ($metode === 'GET') {
        $cari = trim((string) ($_GET['q'] ?? ''));
        $kategoriMentah = trim((string) ($_GET['kategori'] ?? ''));

        $idKategori = null;
        if ($kategoriMentah !== '') {
            $idKategori = filter_var($kategoriMentah, FILTER_VALIDATE_INT);

            if ($idKategori === false || $idKategori === null || $idKategori < 1) {
                kirimError('Filter kategori tidak valid.', 400);
            }
        }

        $sql = 'SELECT p.id_produk, p.nama_produk, p.id_kategori, k.nama_kategori,
                       p.harga, p.stok
                FROM tbl_produk AS p
                INNER JOIN tbl_kategori AS k ON k.id_kategori = p.id_kategori';

        $kondisi = [];

        if ($cari !== '') {
            $kondisi[] = '(p.nama_produk LIKE :cari_produk
                           OR k.nama_kategori LIKE :cari_kategori)';
        }

        if ($idKategori !== null) {
            $kondisi[] = 'p.id_kategori = :id_kategori';
        }

        if ($kondisi !== []) {
            $sql .= ' WHERE ' . implode(' AND ', $kondisi);
        }

        $sql .= ' ORDER BY p.nama_produk ASC';

        $stmt = $pdo->prepare($sql);

        if ($cari !== '') {
            $kataKunci = '%' . $cari . '%';
            $stmt->bindValue(':cari_produk', $kataKunci, PDO::PARAM_STR);
            $stmt->bindValue(':cari_kategori', $kataKunci, PDO::PARAM_STR);
        }

        if ($idKategori !== null) {
            $stmt->bindValue(':id_kategori', $idKategori, PDO::PARAM_INT);
        }

        $stmt->execute();
        $daftar = array_map('formatProduk', $stmt->fetchAll());

        kirimJson(['data' => $daftar]);
    }

    if ($metode === 'POST') {
        $data = validasiProduk(bacaBodyJson());
        pastikanKategoriAda($pdo, $data['id_kategori']);

        $stmt = $pdo->prepare(
            'INSERT INTO tbl_produk (nama_produk, id_kategori, harga, stok)
             VALUES (:nama, :id_kategori, :harga, :stok)'
        );
        $stmt->bindValue(':nama', $data['nama_produk'], PDO::PARAM_STR);
        $stmt->bindValue(':id_kategori', $data['id_kategori'], PDO::PARAM_INT);
        $stmt->bindValue(':harga', $data['harga']);
        $stmt->bindValue(':stok', $data['stok'], PDO::PARAM_INT);
        $stmt->execute();

        $idBaru = (int) $pdo->lastInsertId();

        kirimJson([
            'message' => 'Produk berhasil ditambahkan.',
            'data'    => ambilProduk($pdo, $idBaru),
        ], 201);
    }

    if ($metode === 'PUT') {
        $id = ambilIdProduk();
        $data = validasiProduk(bacaBodyJson());
        pastikanKategoriAda($pdo, $data['id_kategori']);

        if (ambilProduk($pdo, $id) === null) {
            kirimError('Produk tidak ditemukan.', 404);
        }

        $stmt = $pdo->prepare(
            'UPDATE tbl_produk
             SET nama_produk = :nama,
                 id_kategori = :id_kategori,
                 harga = :harga,
                 stok = :stok
             WHERE id_produk = :id'
        );
        $stmt->bindValue(':nama', $data['nama_produk'], PDO::PARAM_STR);
        $stmt->bindValue(':id_kategori', $data['id_kategori'], PDO::PARAM_INT);
        $stmt->bindValue(':harga', $data['harga']);
        $stmt->bindValue(':stok', $data['stok'], PDO::PARAM_INT);
        $stmt->bindValue(':id', $id, PDO::PARAM_INT);
        $stmt->execute();

        kirimJson([
            'message' => 'Data produk berhasil diperbarui.',
            'data'    => ambilProduk($pdo, $id),
        ]);
    }

    if ($metode === 'DELETE') {
        $id = ambilIdProduk();

        $stmt = $pdo->prepare(
            'SELECT COUNT(*) FROM tbl_detail_transaksi WHERE id_produk = :id'
        );
        $stmt->bindValue(':id', $id, PDO::PARAM_INT);
        $stmt->execute();
        $jumlahDipakai = (int) $stmt->fetchColumn();

        if ($jumlahDipakai > 0) {
            kirimError(
                'Produk ini sudah digunakan pada transaksi sehingga tidak dapat dihapus.',
                409
            );
        }

        $stmt = $pdo->prepare(
            'DELETE FROM tbl_produk WHERE id_produk = :id'
        );
        $stmt->bindValue(':id', $id, PDO::PARAM_INT);

        try {
            $stmt->execute();
        } catch (PDOException $e) {
            if ($e->getCode() === '23000') {
                kirimError(
                    'Produk ini masih terkait dengan data transaksi sehingga tidak dapat dihapus.',
                    409
                );
            }
            throw $e;
        }

        if ($stmt->rowCount() === 0) {
            kirimError('Produk tidak ditemukan.', 404);
        }

        kirimJson(['message' => 'Produk berhasil dihapus.']);
    }

    header('Allow: GET, POST, PUT, DELETE');
    kirimError('Metode tidak diizinkan.', 405);
} catch (Throwable $e) {
    error_log('Gagal memproses data produk: ' . $e->getMessage());
    kirimError('Terjadi kesalahan pada server.', 500);
}
