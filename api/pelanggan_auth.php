<?php

declare(strict_types=1);

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/pelanggan_sesi.php';

header('Cache-Control: no-store, private');
$metode = $_SERVER['REQUEST_METHOD'] ?? 'GET';

function profilAkunPelanggan(PDO $pdo, int $idAkun): ?array
{
    $stmt = $pdo->prepare(
        'SELECT a.id_akun, p.id_pelanggan, p.nama_pelanggan, a.username,
                a.email, a.nomor_hp, a.dibuat_pada
         FROM tbl_akun_pelanggan AS a
         INNER JOIN tbl_pelanggan AS p ON p.id_pelanggan = a.id_pelanggan
         WHERE a.id_akun = :id'
    );
    $stmt->execute([':id' => $idAkun]);
    $akun = $stmt->fetch();
    if ($akun === false) {
        return null;
    }

    return [
        'id_pelanggan' => (int) $akun['id_pelanggan'],
        'nama_lengkap' => $akun['nama_pelanggan'],
        'username' => $akun['username'],
        'email' => $akun['email'],
        'nomor_hp' => $akun['nomor_hp'],
        'dibuat_pada' => $akun['dibuat_pada'],
    ];
}

function bodyAkunPelanggan(): array
{
    $isi = file_get_contents('php://input');
    $input = is_string($isi) ? json_decode($isi, true) : null;
    if (!is_array($input)) {
        kirimError('Data yang dikirim tidak valid.', 400);
    }

    return $input;
}

function nomorkan(string $nilai): string
{
    $teks = preg_replace('/[\s().-]/', '', trim($nilai));
    if (!is_string($teks) || !preg_match('/^\+?\d{8,15}$/', $teks)) {
        kirimError('Format nomor HP tidak valid.', 400);
    }

    return $teks;
}

function aturSesiPelanggan(int $idAkun, bool $ingatSaya): void
{
    mulaiSesiPelanggan($ingatSaya);
    session_regenerate_id(true);
    $_SESSION['tokokita_customer_id'] = $idAkun;
    setcookie('tokokita_customer_remember', $ingatSaya ? '1' : '', [
        'expires' => $ingatSaya ? time() + (60 * 60 * 24 * 30) : time() - 42000,
        'path' => '/',
        'secure' => isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
}

try {
    siapkanAkunPelanggan();

    if ($metode === 'GET') {
        $profil = pelangganSaatIni();
        kirimJson(['data' => $profil]);
    }

    if ($metode === 'POST') {
        $input = bodyAkunPelanggan();
        $aksi = (string) ($input['aksi'] ?? 'masuk');

        if ($aksi === 'masuk') {
            $identifier = trim((string) ($input['identifier'] ?? ''));
            $password = (string) ($input['password'] ?? '');
            if ($identifier === '' || $password === '') {
                kirimError('Username, email/nomor HP, dan password wajib diisi.', 400);
            }

            if (filter_var($identifier, FILTER_VALIDATE_EMAIL)) {
                $kolomAkun = 'email';
                $identifier = mb_strtolower($identifier);
            } elseif (preg_match('/^\+?[\d\s().-]+$/', $identifier)) {
                $kolomAkun = 'nomor_hp';
                $identifier = nomorkan($identifier);
            } elseif (preg_match('/^[a-zA-Z0-9._-]{3,50}$/', $identifier)) {
                $kolomAkun = 'username';
                $identifier = mb_strtolower($identifier);
            } else {
                kirimError('Format username, email, atau nomor HP tidak valid.', 400);
            }
            $stmt = $pdo->prepare(
                'SELECT a.id_akun, a.password_hash
                 FROM tbl_akun_pelanggan AS a
                 WHERE a.' . $kolomAkun . ' = :identifier'
            );
            $stmt->bindValue(':identifier', $identifier, PDO::PARAM_STR);
            $stmt->execute();
            $akun = $stmt->fetch();
            if ($akun === false || !password_verify($password, $akun['password_hash'])) {
                kirimError('Username/email/nomor HP atau password salah.', 401);
            }

            $ingatSaya = filter_var(
                $input['ingat_saya'] ?? false,
                FILTER_VALIDATE_BOOLEAN
            );
            aturSesiPelanggan((int) $akun['id_akun'], $ingatSaya);
            kirimJson([
                'message' => 'Berhasil masuk.',
                'data' => profilAkunPelanggan($pdo, (int) $akun['id_akun']),
            ]);
        }

        if ($aksi === 'daftar') {
            $nama = trim((string) ($input['nama_lengkap'] ?? ''));
            $email = mb_strtolower(trim((string) ($input['email'] ?? '')));
            $nomorHp = nomorkan((string) ($input['nomor_hp'] ?? ''));
            $password = (string) ($input['password'] ?? '');
            $konfirmasi = (string) ($input['konfirmasi_password'] ?? '');

            if ($nama === '') {
                kirimError('Nama lengkap wajib diisi.', 400);
            }
            if (mb_strlen($nama) > 100) {
                kirimError('Nama lengkap maksimal 100 karakter.', 400);
            }
            if (filter_var($email, FILTER_VALIDATE_EMAIL) === false) {
                kirimError('Format email tidak valid.', 400);
            }
            if (mb_strlen($password) < 6) {
                kirimError('Password minimal 6 karakter.', 400);
            }
            if (!hash_equals($password, $konfirmasi)) {
                kirimError('Konfirmasi password tidak sama.', 400);
            }

            $pdo->beginTransaction();
            $stmt = $pdo->prepare(
                'SELECT id_akun FROM tbl_akun_pelanggan
                 WHERE email = :email OR nomor_hp = :nomor_hp
                 FOR UPDATE'
            );
            $stmt->execute([':email' => $email, ':nomor_hp' => $nomorHp]);
            if ($stmt->fetch() !== false) {
                $pdo->rollBack();
                kirimError('Email atau nomor HP sudah terdaftar.', 409);
            }

            $stmt = $pdo->prepare(
                'SELECT id_pelanggan, nama_pelanggan, email, nomor_hp
                 FROM tbl_pelanggan
                 WHERE email = :email OR nomor_hp = :nomor_hp
                 ORDER BY id_pelanggan ASC
                 FOR UPDATE'
            );
            $stmt->execute([':email' => $email, ':nomor_hp' => $nomorHp]);
            $cocok = $stmt->fetchAll();
            $idPelanggan = null;
            if ($cocok !== []) {
                $idPelanggan = (int) $cocok[0]['id_pelanggan'];
                foreach ($cocok as $baris) {
                    if ((int) $baris['id_pelanggan'] !== $idPelanggan) {
                        $pdo->rollBack();
                        kirimError('Email dan nomor HP cocok dengan data pelanggan yang berbeda.', 409);
                    }
                    if (
                        ($baris['email'] !== null && $baris['email'] !== $email) ||
                        ($baris['nomor_hp'] !== null && $baris['nomor_hp'] !== $nomorHp)
                    ) {
                        $pdo->rollBack();
                        kirimError('Email atau nomor HP sudah digunakan pada data pelanggan lain.', 409);
                    }
                }

                $stmt = $pdo->prepare(
                    'SELECT id_akun FROM tbl_akun_pelanggan
                     WHERE id_pelanggan = :id'
                );
                $stmt->execute([':id' => $idPelanggan]);
                if ($stmt->fetchColumn() !== false) {
                    $pdo->rollBack();
                    kirimError('Data pelanggan ini sudah memiliki akun.', 409);
                }

                $stmt = $pdo->prepare(
                    'UPDATE tbl_pelanggan
                     SET nama_pelanggan = :nama, email = :email, nomor_hp = :nomor_hp
                     WHERE id_pelanggan = :id'
                );
                $stmt->execute([
                    ':nama' => $nama,
                    ':email' => $email,
                    ':nomor_hp' => $nomorHp,
                    ':id' => $idPelanggan,
                ]);
            } else {
                $stmt = $pdo->prepare(
                    'INSERT INTO tbl_pelanggan
                        (nama_pelanggan, kota, email, nomor_hp)
                     VALUES (:nama, NULL, :email, :nomor_hp)'
                );
                $stmt->execute([
                    ':nama' => $nama,
                    ':email' => $email,
                    ':nomor_hp' => $nomorHp,
                ]);
                $idPelanggan = (int) $pdo->lastInsertId();
            }

            $stmt = $pdo->prepare(
                'INSERT INTO tbl_akun_pelanggan
                    (id_pelanggan, email, nomor_hp, password_hash)
                 VALUES (:id_pelanggan, :email, :nomor_hp, :password)'
            );
            $stmt->execute([
                ':id_pelanggan' => $idPelanggan,
                ':email' => $email,
                ':nomor_hp' => $nomorHp,
                ':password' => password_hash($password, PASSWORD_DEFAULT),
            ]);
            $idAkun = (int) $pdo->lastInsertId();
            $pdo->commit();

            aturSesiPelanggan($idAkun, true);
            kirimJson([
                'message' => 'Akun pelanggan berhasil dibuat.',
                'data' => profilAkunPelanggan($pdo, $idAkun),
            ], 201);
        }

        kirimError('Aksi pelanggan tidak valid.', 400);
    }

    if ($metode === 'DELETE') {
        mulaiSesiPelanggan();
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
        setcookie('tokokita_customer_remember', '', [
            'expires' => time() - 42000,
            'path' => '/',
            'secure' => isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
            'httponly' => true,
            'samesite' => 'Lax',
        ]);
        session_destroy();
        kirimJson(['message' => 'Berhasil keluar dari akun pelanggan.']);
    }

    header('Allow: GET, POST, DELETE');
    kirimError('Metode tidak diizinkan.', 405);
} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    if ($e->getCode() === '23000') {
        kirimError('Email atau nomor HP sudah terdaftar.', 409);
    }
    error_log('Gagal memproses akun pelanggan: ' . $e->getMessage());
    kirimError('Terjadi kesalahan pada server.', 500);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log('Gagal memproses akun pelanggan: ' . $e->getMessage());
    kirimError('Terjadi kesalahan pada server.', 500);
}
