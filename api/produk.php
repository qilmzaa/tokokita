<?php

declare(strict_types=1);

require_once __DIR__ . '/config.php';
$profil = wajibLogin();

/** Folder penyimpanan foto produk yang diunggah. */
const FOLDER_FOTO = __DIR__ . '/uploads/produk';

/** Path publik foto unggahan, diakses frontend melalui proxy /api. */
const URL_FOTO = '/api/uploads/produk';

/** Ukuran maksimal foto yang diunggah (2 MB). */
const UKURAN_FOTO_MAKS = 2 * 1024 * 1024;

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
 * Mem-parsing body multipart untuk metode PUT (PHP tidak melakukannya
 * otomatis), mengisi $_FILES, dan mengembalikan field teks.
 */
function bacaMultipartPut(string $batas): array
{
    $isi = file_get_contents('php://input');

    if ($isi === false) {
        kirimError('Data yang dikirim tidak valid.', 400);
    }

    $bagian = array_slice(explode('--' . $batas, $isi), 1, -1);
    $data = [];
    $berkas = [];

    foreach ($bagian as $potongan) {
        $potongan = ltrim($potongan, "\r\n");

        if (!str_contains($potongan, "\r\n\r\n")) {
            continue;
        }

        [$kepala, $nilai] = explode("\r\n\r\n", $potongan, 2);

        if (!preg_match('/name="([^"]+)"/', $kepala, $nama)) {
            continue;
        }

        // Isi selalu diakhiri \r\n sebelum penutup boundary.
        $nilai = substr($nilai, 0, -2);

        if (str_contains($kepala, 'filename="')) {
            preg_match('/filename="([^"]*)"/', $kepala, $namaBerkas);
            preg_match('/Content-Type:\s*([^\r\n]+)/i', $kepala, $tipe);

            $sementara = tempnam(sys_get_temp_dir(), 'tokokita');
            file_put_contents($sementara, $nilai);

            $berkas[$nama[1]] = [
                'name'     => $namaBerkas[1] ?? 'berkas',
                'type'     => trim($tipe[1] ?? ''),
                'tmp_name' => $sementara,
                'error'    => UPLOAD_ERR_OK,
                'size'     => strlen($nilai),
            ];
        } else {
            $data[$nama[1]] = $nilai;
        }
    }

    $_FILES = $berkas;

    return $data;
}

/**
 * Membaca input produk dari body JSON atau form multipart (unggahan foto).
 */
function bacaInputProduk(): array
{
    $tipeKonten = $_SERVER['CONTENT_TYPE'] ?? '';

    if (!str_contains($tipeKonten, 'multipart/form-data')) {
        return bacaBodyJson();
    }

    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'POST') {
        return $_POST;
    }

    if (!preg_match('/boundary="?([^";]+)"?/i', $tipeKonten, $batas)) {
        kirimError('Data yang dikirim tidak valid.', 400);
    }

    return bacaMultipartPut($batas[1]);
}

/**
 * Menghapus berkas foto unggahan milik produk dari folder foto.
 * Foto placeholder bawaan (di luar folder foto) tidak tersentuh.
 */
function hapusFileFoto(?string $foto): void
{
    if ($foto === null || $foto === '') {
        return;
    }

    $berkas = FOLDER_FOTO . '/' . basename($foto);

    if (is_file($berkas)) {
        @unlink($berkas);
    }
}

/**
 * Memvalidasi unggahan foto (JPG, PNG, WEBP, maksimal 2 MB) lalu
 * memindahkannya ke folder foto. Mengembalikan path publiknya,
 * atau null bila tidak ada foto yang diunggah.
 */
function prosesUnggahanFoto(): ?string
{
    if (!isset($_FILES['foto']) || !is_array($_FILES['foto'])) {
        return null;
    }

    $unggahan = $_FILES['foto'];

    if (($unggahan['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_NO_FILE) {
        return null;
    }

    if ($unggahan['error'] !== UPLOAD_ERR_OK) {
        kirimError('Foto gagal diunggah. Silakan coba lagi.', 400);
    }

    if (($unggahan['size'] ?? 0) > UKURAN_FOTO_MAKS) {
        kirimError('Ukuran foto maksimal 2 MB.', 400);
    }

    $info = @getimagesize($unggahan['tmp_name']);

    if ($info === false) {
        kirimError('Format foto harus JPG, PNG, atau WEBP.', 400);
    }

    $ekstensi = match ($info[2]) {
        IMAGETYPE_JPEG => 'jpg',
        IMAGETYPE_PNG  => 'png',
        IMAGETYPE_WEBP => 'webp',
        default        => null,
    };

    if ($ekstensi === null) {
        kirimError('Format foto harus JPG, PNG, atau WEBP.', 400);
    }

    if (!is_dir(FOLDER_FOTO) && !mkdir(FOLDER_FOTO, 0777, true)) {
        kirimError('Gagal menyiapkan folder foto produk.', 500);
    }

    $namaBerkas = sprintf(
        '%s-%s.%s',
        uniqid(),
        bin2hex(random_bytes(4)),
        $ekstensi
    );
    $tujuan = FOLDER_FOTO . '/' . $namaBerkas;

    // Berkas PUT dipindai manual, jadi move_uploaded_file tidak berlaku.
    if (is_uploaded_file($unggahan['tmp_name'])) {
        $berhasil = move_uploaded_file($unggahan['tmp_name'], $tujuan);
    } else {
        $berhasil = rename($unggahan['tmp_name'], $tujuan);
    }

    if (!$berhasil) {
        kirimError('Gagal menyimpan foto produk.', 500);
    }

    return URL_FOTO . '/' . $namaBerkas;
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
        'foto'          => $baris['foto'] !== null ? (string) $baris['foto'] : null,
    ];
}

/**
 * Mengambil satu produk beserta nama kategorinya.
 */
function ambilProduk(PDO $pdo, int $id): ?array
{
    $stmt = $pdo->prepare(
        'SELECT p.id_produk, p.nama_produk, p.id_kategori, k.nama_kategori,
                p.harga, p.stok, p.foto
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
if ($metode !== 'GET' && $profil['peran'] !== 'Admin') {
    kirimError('Anda tidak memiliki akses.', 403);
}

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
                       p.harga, p.stok, p.foto
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
        $input = bacaInputProduk();
        $data = validasiProduk($input);
        pastikanKategoriAda($pdo, $data['id_kategori']);

        $foto = prosesUnggahanFoto();

        $stmt = $pdo->prepare(
            'INSERT INTO tbl_produk (nama_produk, id_kategori, harga, stok, foto)
             VALUES (:nama, :id_kategori, :harga, :stok, :foto)'
        );
        $stmt->bindValue(':nama', $data['nama_produk'], PDO::PARAM_STR);
        $stmt->bindValue(':id_kategori', $data['id_kategori'], PDO::PARAM_INT);
        $stmt->bindValue(':harga', $data['harga']);
        $stmt->bindValue(':stok', $data['stok'], PDO::PARAM_INT);
        $stmt->bindValue(':foto', $foto, PDO::PARAM_STR);
        $stmt->execute();

        $idBaru = (int) $pdo->lastInsertId();

        kirimJson([
            'message' => 'Produk berhasil ditambahkan.',
            'data'    => ambilProduk($pdo, $idBaru),
        ], 201);
    }

    if ($metode === 'PUT') {
        $id = ambilIdProduk();
        $input = bacaInputProduk();
        $data = validasiProduk($input);
        pastikanKategoriAda($pdo, $data['id_kategori']);

        $produkLama = ambilProduk($pdo, $id);

        if ($produkLama === null) {
            kirimError('Produk tidak ditemukan.', 404);
        }

        // Foto lama dipertahankan kecuali ada unggahan baru atau penanda hapus.
        $fotoBaru = $produkLama['foto'];
        $unggahan = prosesUnggahanFoto();

        if ($unggahan !== null) {
            hapusFileFoto($fotoBaru);
            $fotoBaru = $unggahan;
        } elseif ((string) ($input['hapus_foto'] ?? '') === '1') {
            hapusFileFoto($fotoBaru);
            $fotoBaru = null;
        }

        $stmt = $pdo->prepare(
            'UPDATE tbl_produk
             SET nama_produk = :nama,
                 id_kategori = :id_kategori,
                 harga = :harga,
                 stok = :stok,
                 foto = :foto
             WHERE id_produk = :id'
        );
        $stmt->bindValue(':nama', $data['nama_produk'], PDO::PARAM_STR);
        $stmt->bindValue(':id_kategori', $data['id_kategori'], PDO::PARAM_INT);
        $stmt->bindValue(':harga', $data['harga']);
        $stmt->bindValue(':stok', $data['stok'], PDO::PARAM_INT);
        $stmt->bindValue(':foto', $fotoBaru, PDO::PARAM_STR);
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

        $produkLama = ambilProduk($pdo, $id);

        if ($produkLama === null) {
            kirimError('Produk tidak ditemukan.', 404);
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

        hapusFileFoto($produkLama['foto']);

        kirimJson(['message' => 'Produk berhasil dihapus.']);
    }

    header('Allow: GET, POST, PUT, DELETE');
    kirimError('Metode tidak diizinkan.', 405);
} catch (Throwable $e) {
    error_log('Gagal memproses data produk: ' . $e->getMessage());
    kirimError('Terjadi kesalahan pada server.', 500);
}
