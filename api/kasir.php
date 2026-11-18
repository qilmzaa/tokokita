<?php

declare(strict_types=1);

require_once __DIR__ . '/config.php';
$kasir = wajibLogin();

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    header('Allow: POST');
    kirimError('Metode tidak diizinkan.', 405);
}

$isi = file_get_contents('php://input');
$input = is_string($isi) ? json_decode($isi, true) : null;
if (!is_array($input)) {
    kirimError('Data transaksi tidak valid.', 400);
}

$itemsInput = $input['items'] ?? null;
if (!is_array($itemsInput) || !array_is_list($itemsInput) || $itemsInput === []) {
    kirimError('Minimal satu barang harus ditambahkan.', 400);
}

$items = [];
foreach ($itemsInput as $item) {
    if (!is_array($item)) {
        kirimError('Data barang tidak valid.', 400);
    }
    $id = filter_var($item['id_produk'] ?? null, FILTER_VALIDATE_INT);
    $jumlah = filter_var($item['jumlah'] ?? null, FILTER_VALIDATE_INT);
    if ($id === false || $id === null || $id < 1 || $jumlah === false || $jumlah === null || $jumlah < 1) {
        kirimError('Produk dan jumlah barang tidak valid.', 400);
    }
    $diskonItem = $item['diskon_persen'] ?? 0;
    if (!is_numeric($diskonItem) || (float) $diskonItem < 0 || (float) $diskonItem > 100) {
        kirimError('Diskon barang harus berupa angka antara 0 sampai 100.', 400);
    }
    if (isset($items[$id]) && $items[$id]['diskon_persen'] !== (float) $diskonItem) {
        kirimError('Diskon barang yang sama harus konsisten.', 400);
    }
    $items[$id] = [
        'jumlah' => ($items[$id]['jumlah'] ?? 0) + $jumlah,
        'diskon_persen' => (float) $diskonItem,
    ];
}

$metodeBayar = (string) ($input['metode_pembayaran'] ?? '');
if (!in_array($metodeBayar, ['Tunai', 'QRIS', 'Transfer'], true)) {
    kirimError('Metode pembayaran tidak valid.', 400);
}

$tipeDiskon = (string) ($input['tipe_diskon'] ?? 'nominal');
$diskonMentah = $input['diskon'] ?? 0;
if (
    !in_array($tipeDiskon, ['nominal', 'persen'], true) ||
    !is_numeric($diskonMentah) ||
    (float) $diskonMentah < 0 ||
    ($tipeDiskon === 'persen' && (float) $diskonMentah > 100)
) {
    kirimError('Diskon tidak valid.', 400);
}
$diskonNilai = (float) $diskonMentah;

$uangInput = $input['uang_diterima'] ?? 0;
if (!is_numeric($uangInput) || (float) $uangInput < 0) {
    kirimError('Uang yang diterima tidak valid.', 400);
}
$idPelanggan = $input['id_pelanggan'] ?? null;
if ($idPelanggan !== null && $idPelanggan !== '') {
    $idPelanggan = filter_var($idPelanggan, FILTER_VALIDATE_INT);
    if ($idPelanggan === false || $idPelanggan === null || $idPelanggan < 1) {
        kirimError('Pelanggan yang dipilih tidak valid.', 400);
    }
} else {
    $idPelanggan = null;
}

try {
    $pdo->beginTransaction();

    if ($idPelanggan === null) {
        $stmt = $pdo->prepare(
            'SELECT id_pelanggan, nama_pelanggan FROM tbl_pelanggan
             WHERE nama_pelanggan = :nama ORDER BY id_pelanggan ASC LIMIT 1'
        );
        $stmt->execute([':nama' => 'Umum']);
        $pelangganUmum = $stmt->fetch();
        if ($pelangganUmum === false) {
            $stmt = $pdo->prepare(
                'INSERT INTO tbl_pelanggan (nama_pelanggan, kota)
                 VALUES (:nama, NULL)'
            );
            $stmt->execute([':nama' => 'Umum']);
            $idPelanggan = (int) $pdo->lastInsertId();
            $namaPelanggan = 'Umum';
        } else {
            $idPelanggan = (int) $pelangganUmum['id_pelanggan'];
            $namaPelanggan = $pelangganUmum['nama_pelanggan'];
        }
    } else {
        $stmt = $pdo->prepare(
            'SELECT id_pelanggan, nama_pelanggan
             FROM tbl_pelanggan WHERE id_pelanggan = :id'
        );
        $stmt->execute([':id' => $idPelanggan]);
        $pelangganTerpilih = $stmt->fetch();
        if ($pelangganTerpilih === false) {
            $pdo->rollBack();
            kirimError('Pelanggan tidak ditemukan.', 400);
        }
        $namaPelanggan = $pelangganTerpilih['nama_pelanggan'];
    }

    $produkDipesan = [];
    $subtotalKotor = 0.0;
    $subtotalAsli = 0.0;
    foreach ($items as $idProduk => $detailItem) {
        $jumlah = $detailItem['jumlah'];
        $stmt = $pdo->prepare(
            'SELECT p.id_produk, p.nama_produk, p.harga, p.stok, p.foto,
                    k.nama_kategori
             FROM tbl_produk AS p
             INNER JOIN tbl_kategori AS k ON k.id_kategori = p.id_kategori
             WHERE p.id_produk = :id
             FOR UPDATE'
        );
        $stmt->execute([':id' => $idProduk]);
        $produk = $stmt->fetch();
        if ($produk === false) {
            $pdo->rollBack();
            kirimError('Ada produk yang tidak ditemukan.', 422);
        }
        if ((int) $produk['stok'] < $jumlah) {
            $pdo->rollBack();
            kirimError(
                sprintf(
                    'Stok %s tidak mencukupi. Tersedia %d.',
                    $produk['nama_produk'],
                    (int) $produk['stok']
                ),
                422
            );
        }

        $produk['jumlah'] = $jumlah;
        $produk['harga'] = (float) $produk['harga'];
        $produk['subtotal_asli'] = round($produk['harga'] * $jumlah, 2);
        $produk['diskon_item_persen'] = $detailItem['diskon_persen'];
        $produk['subtotal_kotor'] = round(
            $produk['subtotal_asli'] * (1 - $detailItem['diskon_persen'] / 100),
            2
        );
        $subtotalAsli += $produk['subtotal_asli'];
        $subtotalKotor += $produk['subtotal_kotor'];
        $produkDipesan[] = $produk;
    }

    $subtotalKotor = round($subtotalKotor, 2);
    $diskonTransaksi = $tipeDiskon === 'persen'
        ? round($subtotalKotor * $diskonNilai / 100, 2)
        : min(round($diskonNilai, 2), $subtotalKotor);
    $total = round($subtotalKotor - $diskonTransaksi, 2);
    $diskonTotal = round($subtotalAsli - $total, 2);
    $uangDiterima = $metodeBayar === 'Tunai'
        ? round((float) $uangInput, 2)
        : $total;
    if ($metodeBayar === 'Tunai' && $uangDiterima < $total) {
        $pdo->rollBack();
        kirimError('Uang yang diterima belum mencukupi.', 422);
    }
    $kembalian = round($uangDiterima - $total, 2);

    $tanggalWaktu = date('Y-m-d H:i:s');
    $stmt = $pdo->prepare(
        'INSERT INTO tbl_transaksi
            (tanggal, waktu_transaksi, id_pelanggan, total_belanja, id_pengguna,
             nama_kasir, metode_pembayaran, uang_diterima, kembalian, diskon_nominal)
         VALUES (:tanggal, :waktu, :pelanggan, :total, :pengguna,
                 :nama_kasir, :metode, :uang, :kembalian, :diskon)'
    );
    $stmt->execute([
        ':tanggal' => date('Y-m-d'),
        ':waktu' => $tanggalWaktu,
        ':pelanggan' => $idPelanggan,
        ':total' => $total,
        ':pengguna' => $kasir['id_pengguna'],
        ':nama_kasir' => $kasir['nama_lengkap'],
        ':metode' => $metodeBayar,
        ':uang' => $uangDiterima,
        ':kembalian' => $kembalian,
        ':diskon' => $diskonTotal,
    ]);
    $idTransaksi = (int) $pdo->lastInsertId();

    $itemStruk = [];
    $sudahDialokasikan = 0.0;
    foreach ($produkDipesan as $index => $produk) {
        $sisaDiskon = max(0, round($diskonTransaksi - $sudahDialokasikan, 2));
        $alokasiDiskon = $index === array_key_last($produkDipesan)
            ? $sisaDiskon
            : min(
                $sisaDiskon,
                $produk['subtotal_kotor'],
                round($diskonTransaksi * $produk['subtotal_kotor'] / max($subtotalKotor, 1), 2)
            );
        $sudahDialokasikan += $alokasiDiskon;
        $subtotalItem = round($produk['subtotal_kotor'] - $alokasiDiskon, 2);
        $diskonPersen = $produk['subtotal_asli'] > 0
            ? round((1 - $subtotalItem / $produk['subtotal_asli']) * 100, 2)
            : 0;

        $stmt = $pdo->prepare(
            'INSERT INTO tbl_detail_transaksi
                (id_transaksi, id_produk, jumlah, harga, diskon_persen, subtotal)
             VALUES (:transaksi, :produk, :jumlah, :harga, :diskon, :subtotal)'
        );
        $stmt->execute([
            ':transaksi' => $idTransaksi,
            ':produk' => $produk['id_produk'],
            ':jumlah' => $produk['jumlah'],
            ':harga' => $produk['harga'],
            ':diskon' => $diskonPersen,
            ':subtotal' => $subtotalItem,
        ]);
        $idDetail = (int) $pdo->lastInsertId();

        $stmt = $pdo->prepare(
            'UPDATE tbl_produk SET stok = stok - :jumlah
             WHERE id_produk = :id AND stok >= :jumlah_tersedia'
        );
        $stmt->execute([
            ':jumlah' => $produk['jumlah'],
            ':id' => $produk['id_produk'],
            ':jumlah_tersedia' => $produk['jumlah'],
        ]);
        if ($stmt->rowCount() !== 1) {
            throw new RuntimeException('Stok berubah saat transaksi diproses. Silakan coba lagi.');
        }

        $itemStruk[] = [
            'id_detail' => $idDetail,
            'id_produk' => (int) $produk['id_produk'],
            'nama_produk' => $produk['nama_produk'],
            'nama_kategori' => $produk['nama_kategori'],
            'foto' => $produk['foto'],
            'jumlah' => (int) $produk['jumlah'],
            'harga' => $produk['harga'],
            'diskon_persen' => $diskonPersen,
            'subtotal' => $subtotalItem,
        ];
    }

    $stmt = $pdo->prepare(
        'INSERT INTO tbl_log (tabel, aktivitas, keterangan)
         VALUES (:tabel, :aktivitas, :keterangan)'
    );
    $stmt->execute([
        ':tabel' => 'tbl_transaksi',
        ':aktivitas' => 'PENJUALAN KASIR',
        ':keterangan' => sprintf(
            'Transaksi #%d oleh %s, metode %s, total Rp %s',
            $idTransaksi,
            $kasir['nama_lengkap'],
            $metodeBayar,
            number_format($total, 0, ',', '.')
        ),
    ]);

    $pdo->commit();
    kirimJson([
        'message' => 'Pembayaran berhasil.',
        'data' => [
            'id_transaksi' => $idTransaksi,
            'tanggal' => date('Y-m-d'),
            'waktu_transaksi' => $tanggalWaktu,
            'id_pelanggan' => (int) $idPelanggan,
            'nama_pelanggan' => $namaPelanggan,
            'nama_kasir' => $kasir['nama_lengkap'],
            'metode_pembayaran' => $metodeBayar,
            'subtotal_kotor' => $subtotalKotor,
            'diskon_nominal' => $diskonTotal,
            'uang_diterima' => $uangDiterima,
            'kembalian' => $kembalian,
            'total_belanja' => $total,
            'items' => $itemStruk,
        ],
    ], 201);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log('Gagal memproses pembayaran kasir: ' . $e->getMessage());
    kirimError(
        $e instanceof RuntimeException
            ? $e->getMessage()
            : 'Terjadi kesalahan saat menyimpan pembayaran.',
        $e instanceof RuntimeException ? 422 : 500
    );
}
