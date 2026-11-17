<?php

declare(strict_types=1);

require_once __DIR__ . '/config.php';

header('Cache-Control: no-store, private');
$metode = $_SERVER['REQUEST_METHOD'] ?? 'GET';

try {
    if ($metode === 'GET') {
        mulaiSesi();
        if (!isset($_SESSION['tokokita_user'])) {
            kirimError('Sesi login tidak ditemukan.', 401);
        }

        kirimJson(['data' => ['nama_pengguna' => $_SESSION['tokokita_user']]]);
    }

    if ($metode === 'POST') {
        $body = file_get_contents('php://input');
        $input = is_string($body) ? json_decode($body, true) : null;
        if (!is_array($input)) {
            kirimError('Data login tidak valid.', 400);
        }

        $namaPengguna = trim((string) ($input['nama_pengguna'] ?? ''));
        $kataSandi = (string) ($input['kata_sandi'] ?? '');
        $ingatSaya = filter_var($input['ingat_saya'] ?? false, FILTER_VALIDATE_BOOLEAN);
        $usernameKonfigurasi = getenv('TOKOKITA_USERNAME') ?: LOGIN_DEFAULT_USERNAME;
        $passwordKonfigurasi = getenv('TOKOKITA_PASSWORD') ?: LOGIN_DEFAULT_PASSWORD;

        if (
            $namaPengguna === '' ||
            $kataSandi === '' ||
            !hash_equals($usernameKonfigurasi, $namaPengguna) ||
            !hash_equals($passwordKonfigurasi, $kataSandi)
        ) {
            kirimError('Nama pengguna atau kata sandi salah.', 401);
        }

        mulaiSesi($ingatSaya);
        session_regenerate_id(true);
        $_SESSION['tokokita_user'] = $usernameKonfigurasi;
        setcookie('tokokita_remember', $ingatSaya ? '1' : '', [
            'expires'  => $ingatSaya ? time() + (60 * 60 * 24 * 30) : time() - 42000,
            'path'     => '/',
            'secure'   => isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
            'httponly' => true,
            'samesite' => 'Lax',
        ]);

        kirimJson([
            'message' => 'Berhasil masuk.',
            'data'    => ['nama_pengguna' => $usernameKonfigurasi],
        ]);
    }

    if ($metode === 'DELETE') {
        mulaiSesi();
        $_SESSION = [];
        if (ini_get('session.use_cookies')) {
            $parameter = session_get_cookie_params();
            setcookie(session_name(), '', [
                'expires'  => time() - 42000,
                'path'     => $parameter['path'],
                'domain'   => $parameter['domain'],
                'secure'   => $parameter['secure'],
                'httponly' => $parameter['httponly'],
                'samesite' => $parameter['samesite'] ?? 'Lax',
            ]);
        }
        setcookie('tokokita_remember', '', [
            'expires'  => time() - 42000,
            'path'     => '/',
            'secure'   => isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
            'httponly' => true,
            'samesite' => 'Lax',
        ]);
        session_destroy();

        kirimJson(['message' => 'Berhasil keluar.']);
    }

    header('Allow: GET, POST, DELETE');
    kirimError('Metode tidak diizinkan.', 405);
} catch (Throwable $e) {
    error_log('Gagal memproses autentikasi: ' . $e->getMessage());
    kirimError('Terjadi kesalahan pada server.', 500);
}
