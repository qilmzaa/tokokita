<?php

declare(strict_types=1);

require_once __DIR__ . '/config.php';
header('Cache-Control: no-store, private');

$metode = $_SERVER['REQUEST_METHOD'] ?? 'GET';

try {
    siapkanPenggunaAwal();

    if ($metode === 'GET') {
        $profil = wajibLogin();
        kirimJson(['data' => $profil]);
    }

    if ($metode === 'POST') {
        $isi = file_get_contents('php://input');
        $input = is_string($isi) ? json_decode($isi, true) : null;
        if (!is_array($input)) {
            kirimError('Data login tidak valid.', 400);
        }

        $username = trim((string) ($input['nama_pengguna'] ?? ''));
        $kataSandi = (string) ($input['kata_sandi'] ?? '');
        if ($username === '' || $kataSandi === '') {
            kirimError('Nama pengguna dan kata sandi wajib diisi.', 400);
        }

        $stmt = $pdo->prepare(
            'SELECT id_pengguna, nama_lengkap, username, password_hash, peran
             FROM tbl_pengguna
             WHERE username = :username AND status_aktif = 1'
        );
        $stmt->bindValue(':username', $username, PDO::PARAM_STR);
        $stmt->execute();
        $pengguna = $stmt->fetch();
        if ($pengguna === false || !password_verify($kataSandi, $pengguna['password_hash'])) {
            kirimError('Nama pengguna atau kata sandi salah.', 401);
        }

        $ingatSaya = filter_var(
            $input['ingat_saya'] ?? false,
            FILTER_VALIDATE_BOOLEAN
        );
        mulaiSesi($ingatSaya);
        session_regenerate_id(true);
        $_SESSION['tokokita_user_id'] = (int) $pengguna['id_pengguna'];
        setcookie('tokokita_remember', $ingatSaya ? '1' : '', [
            'expires' => $ingatSaya ? time() + (60 * 60 * 24 * 30) : time() - 42000,
            'path' => '/',
            'secure' => isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
            'httponly' => true,
            'samesite' => 'Lax',
        ]);

        kirimJson([
            'message' => 'Berhasil masuk.',
            'data' => [
                'id_pengguna' => (int) $pengguna['id_pengguna'],
                'nama_lengkap' => $pengguna['nama_lengkap'],
                'nama_pengguna' => $pengguna['username'],
                'peran' => $pengguna['peran'],
            ],
        ]);
    }

    if ($metode === 'DELETE') {
        mulaiSesi();
        $_SESSION = [];
        if (ini_get('session.use_cookies')) {
            $parameter = session_get_cookie_params();
            setcookie(session_name(), '', [
                'expires' => time() - 42000,
                'path' => $parameter['path'],
                'domain' => $parameter['domain'],
                'secure' => $parameter['secure'],
                'httponly' => $parameter['httponly'],
                'samesite' => $parameter['samesite'] ?? 'Lax',
            ]);
        }
        setcookie('tokokita_remember', '', [
            'expires' => time() - 42000,
            'path' => '/',
            'secure' => isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
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
