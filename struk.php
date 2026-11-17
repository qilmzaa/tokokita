<?php
/* =====================================================
   STRUK BELANJA - file mandiri, bisa diedit sendiri
   Letakkan di: C:\xampp\htdocs\tokokita\struk.php

   Cara pakai (buka lewat browser):
     http://localhost/tokokita/struk.php?id=13
     http://localhost/tokokita/struk.php?id=13&bayar=200000   (dengan uang diterima)
     http://localhost/tokokita/struk.php?id=13&autoprint=0    (hanya pratinjau)
   ===================================================== */

date_default_timezone_set('Asia/Jakarta');

/* ---------- 1. PENGATURAN (silakan ubah) ---------- */

// Identitas toko (tampil di bagian atas struk)
$toko = [
    'nama'    => 'TOKO KITA',
    'alamat'  => 'Jl. Merdeka No. 1, Sumenep',
    'telepon' => 'Telp. 0812-3456-7890',
    'kasir'   => 'Admin',
];

// Tulisan di bagian bawah struk (satu baris per item)
$footer = [
    'Terima kasih atas kunjungan Anda',
    'Barang yang sudah dibeli tidak',
    'dapat ditukar / dikembalikan',
];

// Lebar kertas printer: '80mm' (umumnya Epson TM-T82/T88/U220) atau '58mm'
$kertas = '80mm';

// Koneksi database
$db = [
    'host' => 'localhost',
    'nama' => 'db_toko_proyek',
    'user' => 'root',
    'pass' => '',
];

/* ---------- 2. FUNGSI BANTU ---------- */
function rp($angka)
{
    return 'Rp' . number_format((float)$angka, 0, ',', '.');
}
function h($teks)
{
    return htmlspecialchars((string)$teks, ENT_QUOTES, 'UTF-8');
}

/* ---------- 3. AMBIL DATA ---------- */
$id        = isset($_GET['id']) ? (int)$_GET['id'] : 0;
$bayar     = isset($_GET['bayar']) ? (float)$_GET['bayar'] : 0;
$autoprint = !isset($_GET['autoprint']) || $_GET['autoprint'] !== '0';

try {
    $pdo = new PDO(
        "mysql:host={$db['host']};dbname={$db['nama']};charset=utf8mb4",
        $db['user'],
        $db['pass'],
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    $st = $pdo->prepare(
        'SELECT t.id_transaksi, t.tanggal, t.total_belanja, p.nama_pelanggan
         FROM tbl_transaksi t
         JOIN tbl_pelanggan p ON t.id_pelanggan = p.id_pelanggan
         WHERE t.id_transaksi = ?'
    );
    $st->execute([$id]);
    $trx = $st->fetch(PDO::FETCH_ASSOC);

    $items = [];
    if ($trx) {
        $st = $pdo->prepare(
            'SELECT pr.nama_produk, d.jumlah, d.harga, d.diskon_persen, d.subtotal
             FROM tbl_detail_transaksi d
             JOIN tbl_produk pr ON d.id_produk = pr.id_produk
             WHERE d.id_transaksi = ?
             ORDER BY d.id_detail'
        );
        $st->execute([$id]);
        $items = $st->fetchAll(PDO::FETCH_ASSOC);
    }
} catch (PDOException $e) {
    http_response_code(500);
    exit('Gagal terhubung ke database. Pastikan MySQL di XAMPP menyala.');
}

if (!$trx) {
    http_response_code(404);
    exit('Transaksi tidak ditemukan.');
}

$total     = (float)$trx['total_belanja'];
$jmlItem   = count($items);
$jmlQty    = array_sum(array_column($items, 'jumlah'));
$tampilBayar = $bayar >= $total && $bayar > 0;

// Ukuran sesuai lebar kertas
if ($kertas === '58mm') {
    $lebar = '48mm';
    $huruf = '11px';
} else {
    $kertas = '80mm';
    $lebar = '72mm';
    $huruf = '12px';
}
?>
<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Struk TRX-<?= str_pad($trx['id_transaksi'], 6, '0', STR_PAD_LEFT) ?></title>
<style>
    /* Ukuran kertas untuk printer struk */
    @page { size: <?= $kertas ?> auto; margin: 0; }

    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; background: #e5e7eb; }
    body { font-family: "Courier New", Courier, monospace; color: #000; }

    .struk {
        width: <?= $lebar ?>;
        margin: 16px auto;
        padding: 4mm 2mm;
        background: #fff;
        font-size: <?= $huruf ?>;
        line-height: 1.4;
        box-shadow: 0 2px 10px rgba(0,0,0,.15);
    }
    .tengah { text-align: center; }
    .tebal  { font-weight: 700; }
    .nama-toko { font-size: 1.4em; font-weight: 700; letter-spacing: .5px; }
    .garis { border-top: 1px dashed #000; margin: 6px 0; }
    .baris { display: flex; justify-content: space-between; gap: 6px; }
    .baris > span:last-child { text-align: right; white-space: nowrap; }
    .barang { margin-bottom: 4px; }
    .barang .nama { word-break: break-word; }
    .kecil { font-size: .9em; }
    .total { font-size: 1.3em; font-weight: 700; }

    .aksi {
        text-align: center; margin: 12px auto 24px;
        font-family: system-ui, sans-serif;
    }
    .aksi button {
        font-size: 14px; padding: 8px 18px; border: 0; border-radius: 6px;
        background: #4f46e5; color: #fff; cursor: pointer;
    }

    @media print {
        html, body { background: #fff; }
        .struk { margin: 0 auto; box-shadow: none; }
        .aksi { display: none; }
    }
</style>
</head>
<body>

<div class="struk">
    <div class="tengah">
        <div class="nama-toko"><?= h($toko['nama']) ?></div>
        <div><?= h($toko['alamat']) ?></div>
        <div><?= h($toko['telepon']) ?></div>
    </div>

    <div class="garis"></div>

    <div class="baris"><span>No</span><span>TRX-<?= str_pad($trx['id_transaksi'], 6, '0', STR_PAD_LEFT) ?></span></div>
    <div class="baris"><span>Tanggal</span><span><?= h(date('d/m/Y', strtotime($trx['tanggal']))) ?></span></div>
    <div class="baris"><span>Pelanggan</span><span><?= h($trx['nama_pelanggan']) ?></span></div>
    <div class="baris"><span>Kasir</span><span><?= h($toko['kasir']) ?></span></div>

    <div class="garis"></div>

    <?php foreach ($items as $it): ?>
        <div class="barang">
            <div class="nama"><?= h($it['nama_produk']) ?></div>
            <div class="baris">
                <span><?= (int)$it['jumlah'] ?> x <?= number_format($it['harga'], 0, ',', '.') ?></span>
                <span><?= number_format($it['subtotal'], 0, ',', '.') ?></span>
            </div>
            <?php if ((float)$it['diskon_persen'] > 0): ?>
                <div class="kecil">Diskon <?= rtrim(rtrim(number_format($it['diskon_persen'], 2, ',', '.'), '0'), ',') ?>%</div>
            <?php endif; ?>
        </div>
    <?php endforeach; ?>

    <div class="garis"></div>

    <div class="baris kecil"><span>Jumlah item</span><span><?= $jmlItem ?> (<?= (int)$jmlQty ?> pcs)</span></div>
    <div class="baris total"><span>TOTAL</span><span><?= rp($total) ?></span></div>

    <?php if ($tampilBayar): ?>
        <div class="baris"><span>Tunai</span><span><?= rp($bayar) ?></span></div>
        <div class="baris tebal"><span>Kembali</span><span><?= rp($bayar - $total) ?></span></div>
    <?php endif; ?>

    <div class="garis"></div>

    <div class="tengah">
        <?php foreach ($footer as $baris): ?>
            <div><?= h($baris) ?></div>
        <?php endforeach; ?>
        <div class="kecil" style="margin-top:6px">Dicetak: <?= date('d/m/Y H:i') ?></div>
    </div>
</div>

<div class="aksi">
    <button type="button" onclick="window.print()">Cetak Struk</button>
</div>

<?php if ($autoprint): ?>
<script>
    // Otomatis membuka perintah cetak, lalu menutup jendela setelah selesai
    window.addEventListener('load', function () {
        setTimeout(function () { window.print(); }, 300);
    });
    window.addEventListener('afterprint', function () { window.close(); });
</script>
<?php endif; ?>

</body>
</html>