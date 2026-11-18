<?php

declare(strict_types=1);

/**
 * Konfigurasi pusat TokoKita.
 * Satu-satunya tempat koneksi database dibuat.
 */

date_default_timezone_set('Asia/Jakarta');
ini_set('display_errors', '0');

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

const DB_HOST = 'localhost';
const DB_NAME = 'db_toko_proyek';
const DB_USER = 'root';
const DB_PASS = '';
const DB_CHARSET = 'utf8mb4';

/** Kredensial demo lokal; dapat dioverride melalui environment XAMPP. */
const LOGIN_DEFAULT_USERNAME = 'admin';
const LOGIN_DEFAULT_PASSWORD = 'Admin123!';

try {
    $dsn = sprintf(
        'mysql:host=%s;dbname=%s;charset=%s',
        DB_HOST,
        DB_NAME,
        DB_CHARSET
    );

    $pdo = new PDO($dsn, DB_USER, DB_PASS, [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ]);
} catch (PDOException $e) {
    error_log('Koneksi database gagal: ' . $e->getMessage());
    kirimError('Koneksi ke database gagal.', 500);
}

/**
 * Mengirim respons JSON lalu menghentikan eksekusi.
 */
function kirimJson(array $data, int $status = 200): never
{
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

/**
 * Mengirim respons error berformat {"error": "pesan"}.
 */
function kirimError(string $pesan, int $status = 400): never
{
    kirimJson(['error' => $pesan], $status);
}

/** Memulai sesi dengan cookie yang tidak dapat dibaca JavaScript. */
function mulaiSesi(?bool $ingatSaya = null): void
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }

    $ingatSaya = $ingatSaya ?? (($_COOKIE['tokokita_remember'] ?? '') === '1');
    ini_set('session.use_strict_mode', '1');
    ini_set('session.gc_maxlifetime', (string) ($ingatSaya ? 60 * 60 * 24 * 30 : 1440));
    session_name('tokokita_session');
    session_set_cookie_params([
        'lifetime' => $ingatSaya ? 60 * 60 * 24 * 30 : 0,
        'path'     => '/',
        'secure'   => isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
    session_start();
}

/** Menyiapkan akun demo sekali saja; kata sandi selalu disimpan sebagai hash. */
function siapkanPenggunaAwal(): void
{
    global $pdo;

    $pdo->prepare(
        'CREATE TABLE IF NOT EXISTS tbl_pengguna (
            id_pengguna INT AUTO_INCREMENT PRIMARY KEY,
            nama_lengkap VARCHAR(100) NOT NULL,
            username VARCHAR(50) NOT NULL UNIQUE,
            password_hash VARCHAR(255) NOT NULL,
            peran ENUM(\'Admin\', \'Kasir\') NOT NULL,
            status_aktif TINYINT(1) NOT NULL DEFAULT 1,
            dibuat_pada TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4'
    )->execute();

    $stmt = $pdo->prepare('SELECT COUNT(*) FROM tbl_pengguna');
    $stmt->execute();
    if ((int) $stmt->fetchColumn() !== 0) {
        return;
    }

    $stmt = $pdo->prepare(
        'INSERT INTO tbl_pengguna
            (nama_lengkap, username, password_hash, peran, status_aktif)
         VALUES (:nama, :username, :password, :peran, 1)'
    );
    foreach ([
        ['Admin Toko', 'admin', 'Admin123!', 'Admin'],
        ['Kasir Satu', 'kasir', 'Kasir123!', 'Kasir'],
        ['Kasir Dua', 'kasir2', 'Kasir123!', 'Kasir'],
    ] as [$nama, $username, $kataSandi, $peran]) {
        $stmt->execute([
            ':nama' => $nama,
            ':username' => $username,
            ':password' => password_hash($kataSandi, PASSWORD_DEFAULT),
            ':peran' => $peran,
        ]);
    }
}

/** Mengembalikan profil sesi yang masih aktif. */
function penggunaSaatIni(): ?array
{
    global $pdo;

    mulaiSesi();
    $id = filter_var($_SESSION['tokokita_user_id'] ?? null, FILTER_VALIDATE_INT);
    if ($id === false || $id === null || $id < 1) {
        return null;
    }

    static $profil = null;
    if (is_array($profil)) {
        return $profil;
    }

    $stmt = $pdo->prepare(
        'SELECT id_pengguna, nama_lengkap, username, peran
         FROM tbl_pengguna
         WHERE id_pengguna = :id AND status_aktif = 1'
    );
    $stmt->bindValue(':id', $id, PDO::PARAM_INT);
    $stmt->execute();
    $baris = $stmt->fetch();
    if ($baris === false) {
        return null;
    }

    $profil = [
        'id_pengguna' => (int) $baris['id_pengguna'],
        'nama_lengkap' => $baris['nama_lengkap'],
        'nama_pengguna' => $baris['username'],
        'peran' => $baris['peran'],
    ];

    return $profil;
}

/** Melindungi endpoint data agar hanya dapat diakses setelah login. */
function wajibLogin(): array
{
    $profil = penggunaSaatIni();
    if ($profil === null) {
        kirimError('Silakan masuk terlebih dahulu.', 401);
    }

    return $profil;
}

/** Melindungi endpoint berdasarkan peran pengguna. */
function wajibPeran(array $peranDiizinkan): array
{
    $profil = wajibLogin();
    if (!in_array($profil['peran'], $peranDiizinkan, true)) {
        kirimError('Anda tidak memiliki akses.', 403);
    }

    return $profil;
}
