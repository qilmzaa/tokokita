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

/** Melindungi endpoint data agar hanya dapat diakses setelah login. */
function wajibLogin(): void
{
    mulaiSesi();

    if (!isset($_SESSION['tokokita_user'])) {
        kirimError('Silakan masuk terlebih dahulu.', 401);
    }
}
