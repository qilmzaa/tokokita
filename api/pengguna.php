<?php

declare(strict_types=1);

require_once __DIR__ . '/config.php';
siapkanPenggunaAwal();
$penggunaSaatIni = wajibPeran(['Admin']);

function bodyPengguna(): array
{
    $isi = file_get_contents('php://input');
    $data = is_string($isi) ? json_decode($isi, true) : null;
    if (!is_array($data)) {
        kirimError('Data yang dikirim tidak valid.', 400);
    }

    return $data;
}

function idPengguna(): int
{
    $id = filter_var($_GET['id'] ?? null, FILTER_VALIDATE_INT);
    if ($id === false || $id === null || $id < 1) {
        kirimError('ID pengguna tidak valid.', 400);
    }

    return $id;
}

function validasiDataPengguna(array $input, bool $butuhPassword): array
{
    $nama = trim((string) ($input['nama_lengkap'] ?? ''));
    $username = trim((string) ($input['username'] ?? ''));
    $peran = (string) ($input['peran'] ?? '');
    $password = (string) ($input['password'] ?? '');

    if ($nama === '') {
        kirimError('Nama lengkap wajib diisi.', 400);
    }
    if (mb_strlen($nama) > 100) {
        kirimError('Nama lengkap maksimal 100 karakter.', 400);
    }
    if ($username === '' || preg_match('/\s/u', $username)) {
        kirimError('Username wajib diisi dan tidak boleh mengandung spasi.', 400);
    }
    if (mb_strlen($username) > 50) {
        kirimError('Username maksimal 50 karakter.', 400);
    }
    if (!in_array($peran, ['Admin', 'Kasir'], true)) {
        kirimError('Peran pengguna tidak valid.', 400);
    }
    if (($butuhPassword || $password !== '') && mb_strlen($password) < 6) {
        kirimError('Kata sandi minimal 6 karakter.', 400);
    }

    return [
        'nama_lengkap' => $nama,
        'username' => $username,
        'peran' => $peran,
        'password' => $password,
    ];
}

function pastikanAdminAktifMasihAda(PDO $pdo): void
{
    $stmt = $pdo->prepare(
        'SELECT id_pengguna FROM tbl_pengguna
         WHERE peran = :peran AND status_aktif = 1
         FOR UPDATE'
    );
    $stmt->execute([':peran' => 'Admin']);
    if (count($stmt->fetchAll()) < 2) {
        kirimError('Sistem harus memiliki minimal satu Admin aktif.', 409);
    }
}

$metode = $_SERVER['REQUEST_METHOD'] ?? 'GET';

try {
    if ($metode === 'GET') {
        $cari = trim((string) ($_GET['q'] ?? ''));
        $peran = trim((string) ($_GET['peran'] ?? ''));
        if ($peran !== '' && !in_array($peran, ['Admin', 'Kasir'], true)) {
            kirimError('Filter peran tidak valid.', 400);
        }

        $sql = 'SELECT id_pengguna, nama_lengkap, username, peran,
                       status_aktif, dibuat_pada
                FROM tbl_pengguna';
        $kondisi = [];
        if ($cari !== '') {
            $kondisi[] = '(nama_lengkap LIKE :nama OR username LIKE :username)';
        }
        if ($peran !== '') {
            $kondisi[] = 'peran = :peran';
        }
        if ($kondisi !== []) {
            $sql .= ' WHERE ' . implode(' AND ', $kondisi);
        }
        $sql .= ' ORDER BY dibuat_pada DESC, id_pengguna DESC';

        $stmt = $pdo->prepare($sql);
        if ($cari !== '') {
            $kataKunci = '%' . $cari . '%';
            $stmt->bindValue(':nama', $kataKunci, PDO::PARAM_STR);
            $stmt->bindValue(':username', $kataKunci, PDO::PARAM_STR);
        }
        if ($peran !== '') {
            $stmt->bindValue(':peran', $peran, PDO::PARAM_STR);
        }
        $stmt->execute();

        $data = array_map(
            static fn (array $baris): array => [
                'id_pengguna' => (int) $baris['id_pengguna'],
                'nama_lengkap' => $baris['nama_lengkap'],
                'username' => $baris['username'],
                'peran' => $baris['peran'],
                'status_aktif' => (bool) $baris['status_aktif'],
                'dibuat_pada' => $baris['dibuat_pada'],
            ],
            $stmt->fetchAll()
        );
        kirimJson(['data' => $data]);
    }

    if ($metode === 'POST') {
        $data = validasiDataPengguna(bodyPengguna(), true);
        $stmt = $pdo->prepare(
            'SELECT COUNT(*) FROM tbl_pengguna WHERE username = :username'
        );
        $stmt->execute([':username' => $data['username']]);
        if ((int) $stmt->fetchColumn() > 0) {
            kirimError('Username sudah digunakan.', 409);
        }

        $stmt = $pdo->prepare(
            'INSERT INTO tbl_pengguna
                (nama_lengkap, username, password_hash, peran, status_aktif)
             VALUES (:nama, :username, :password, :peran, 1)'
        );
        $stmt->execute([
            ':nama' => $data['nama_lengkap'],
            ':username' => $data['username'],
            ':password' => password_hash($data['password'], PASSWORD_DEFAULT),
            ':peran' => $data['peran'],
        ]);
        kirimJson(['message' => 'Pengguna berhasil ditambahkan.'], 201);
    }

    if ($metode === 'PUT') {
        $id = idPengguna();
        $input = bodyPengguna();
        $aksi = (string) ($input['action'] ?? 'edit');

        $stmt = $pdo->prepare(
            'SELECT id_pengguna, nama_lengkap, username, peran, status_aktif
             FROM tbl_pengguna WHERE id_pengguna = :id'
        );
        $stmt->execute([':id' => $id]);
        $lama = $stmt->fetch();
        if ($lama === false) {
            kirimError('Pengguna tidak ditemukan.', 404);
        }

        if ($aksi === 'reset_password') {
            $password = (string) ($input['password'] ?? '');
            if (mb_strlen($password) < 6) {
                kirimError('Kata sandi minimal 6 karakter.', 400);
            }
            $stmt = $pdo->prepare(
                'UPDATE tbl_pengguna SET password_hash = :password
                 WHERE id_pengguna = :id'
            );
            $stmt->execute([
                ':password' => password_hash($password, PASSWORD_DEFAULT),
                ':id' => $id,
            ]);
            kirimJson(['message' => 'Kata sandi berhasil direset.']);
        }

        if ($aksi === 'status') {
            $aktif = filter_var($input['status_aktif'] ?? null, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
            if ($aktif === null) {
                kirimError('Status pengguna tidak valid.', 400);
            }
            if (!$aktif && $id === $penggunaSaatIni['id_pengguna']) {
                kirimError('Anda tidak dapat menonaktifkan akun sendiri.', 409);
            }
            if (!$aktif && $lama['peran'] === 'Admin' && (bool) $lama['status_aktif']) {
                $pdo->beginTransaction();
                pastikanAdminAktifMasihAda($pdo);
                $stmt = $pdo->prepare(
                    'UPDATE tbl_pengguna SET status_aktif = 0 WHERE id_pengguna = :id'
                );
                $stmt->execute([':id' => $id]);
                $pdo->commit();
            } else {
                $stmt = $pdo->prepare(
                    'UPDATE tbl_pengguna SET status_aktif = :status
                     WHERE id_pengguna = :id'
                );
                $stmt->execute([':status' => (int) $aktif, ':id' => $id]);
            }
            kirimJson(['message' => $aktif ? 'Pengguna berhasil diaktifkan.' : 'Pengguna berhasil dinonaktifkan.']);
        }

        if ($aksi !== 'edit') {
            kirimError('Aksi pengguna tidak valid.', 400);
        }
        $data = validasiDataPengguna($input, false);
        if ($id === $penggunaSaatIni['id_pengguna'] && $data['peran'] !== 'Admin') {
            kirimError('Peran akun Admin yang sedang digunakan tidak dapat diubah.', 409);
        }

        $stmt = $pdo->prepare(
            'SELECT COUNT(*) FROM tbl_pengguna
             WHERE username = :username AND id_pengguna <> :id'
        );
        $stmt->execute([':username' => $data['username'], ':id' => $id]);
        if ((int) $stmt->fetchColumn() > 0) {
            kirimError('Username sudah digunakan.', 409);
        }

        if ($lama['peran'] === 'Admin' && (bool) $lama['status_aktif'] && $data['peran'] !== 'Admin') {
            $pdo->beginTransaction();
            pastikanAdminAktifMasihAda($pdo);
            $stmt = $pdo->prepare(
                'UPDATE tbl_pengguna
                 SET nama_lengkap = :nama, username = :username, peran = :peran
                 WHERE id_pengguna = :id'
            );
            $stmt->execute([
                ':nama' => $data['nama_lengkap'],
                ':username' => $data['username'],
                ':peran' => $data['peran'],
                ':id' => $id,
            ]);
            $pdo->commit();
        } else {
            $stmt = $pdo->prepare(
                'UPDATE tbl_pengguna
                 SET nama_lengkap = :nama, username = :username, peran = :peran
                 WHERE id_pengguna = :id'
            );
            $stmt->execute([
                ':nama' => $data['nama_lengkap'],
                ':username' => $data['username'],
                ':peran' => $data['peran'],
                ':id' => $id,
            ]);
        }
        kirimJson(['message' => 'Data pengguna berhasil diperbarui.']);
    }

    if ($metode === 'DELETE') {
        $id = idPengguna();
        if ($id === $penggunaSaatIni['id_pengguna']) {
            kirimError('Anda tidak dapat menghapus akun sendiri.', 409);
        }

        $stmt = $pdo->prepare(
            'SELECT peran, status_aktif FROM tbl_pengguna WHERE id_pengguna = :id'
        );
        $stmt->execute([':id' => $id]);
        $lama = $stmt->fetch();
        if ($lama === false) {
            kirimError('Pengguna tidak ditemukan.', 404);
        }

        if ($lama['peran'] === 'Admin' && (bool) $lama['status_aktif']) {
            $pdo->beginTransaction();
            pastikanAdminAktifMasihAda($pdo);
            $stmt = $pdo->prepare('DELETE FROM tbl_pengguna WHERE id_pengguna = :id');
            $stmt->execute([':id' => $id]);
            $pdo->commit();
        } else {
            $stmt = $pdo->prepare('DELETE FROM tbl_pengguna WHERE id_pengguna = :id');
            $stmt->execute([':id' => $id]);
        }
        kirimJson(['message' => 'Pengguna berhasil dihapus.']);
    }

    header('Allow: GET, POST, PUT, DELETE');
    kirimError('Metode tidak diizinkan.', 405);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log('Gagal mengelola pengguna: ' . $e->getMessage());
    kirimError('Terjadi kesalahan pada server.', 500);
}
