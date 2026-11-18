<?php

declare(strict_types=1);

/** Menambah kolom kontak pada instalasi lama dan menyiapkan tabel akun. */
function siapkanAkunPelanggan(): void
{
    global $pdo;

    foreach ([
        'email' => 'VARCHAR(254) NULL',
        'nomor_hp' => 'VARCHAR(20) NULL',
    ] as $kolom => $definisi) {
        $stmt = $pdo->prepare(
            'SELECT COUNT(*) FROM information_schema.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE()
               AND TABLE_NAME = :tabel AND COLUMN_NAME = :kolom'
        );
        $stmt->execute([':tabel' => 'tbl_pelanggan', ':kolom' => $kolom]);
        if ((int) $stmt->fetchColumn() === 0) {
            try {
                $pdo->prepare("ALTER TABLE tbl_pelanggan ADD COLUMN {$kolom} {$definisi}")->execute();
            } catch (PDOException $e) {
                $stmt->execute([':tabel' => 'tbl_pelanggan', ':kolom' => $kolom]);
                if ((int) $stmt->fetchColumn() === 0) {
                    throw $e;
                }
            }
        }
    }

    foreach ([
        'uq_pelanggan_email' => 'email',
        'uq_pelanggan_nomor_hp' => 'nomor_hp',
    ] as $indeks => $kolom) {
        $stmt = $pdo->prepare(
            'SELECT COUNT(*) FROM information_schema.STATISTICS
             WHERE TABLE_SCHEMA = DATABASE()
               AND TABLE_NAME = :tabel AND INDEX_NAME = :indeks'
        );
        $stmt->execute([':tabel' => 'tbl_pelanggan', ':indeks' => $indeks]);
        if ((int) $stmt->fetchColumn() === 0) {
            try {
                $pdo->prepare("ALTER TABLE tbl_pelanggan ADD UNIQUE INDEX {$indeks} ({$kolom})")->execute();
            } catch (PDOException $e) {
                $stmt->execute([':tabel' => 'tbl_pelanggan', ':indeks' => $indeks]);
                if ((int) $stmt->fetchColumn() === 0) {
                    throw $e;
                }
            }
        }
    }

    $pdo->prepare(
        'CREATE TABLE IF NOT EXISTS tbl_akun_pelanggan (
            id_akun INT AUTO_INCREMENT PRIMARY KEY,
            id_pelanggan INT NOT NULL UNIQUE,
            email VARCHAR(254) NOT NULL UNIQUE,
            nomor_hp VARCHAR(20) NOT NULL UNIQUE,
            username VARCHAR(50) NULL,
            password_hash VARCHAR(255) NOT NULL,
            dibuat_pada TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY uq_akun_pelanggan_username (username),
            FOREIGN KEY (id_pelanggan) REFERENCES tbl_pelanggan(id_pelanggan)
                ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4'
    )->execute();

    $stmt = $pdo->prepare(
        'SELECT COUNT(*) FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = :tabel AND COLUMN_NAME = :kolom'
    );
    $stmt->execute([':tabel' => 'tbl_akun_pelanggan', ':kolom' => 'username']);
    if ((int) $stmt->fetchColumn() === 0) {
        $pdo->prepare(
            'ALTER TABLE tbl_akun_pelanggan ADD COLUMN username VARCHAR(50) NULL'
        )->execute();
    }

    $stmt = $pdo->prepare(
        'SELECT COUNT(*) FROM information_schema.STATISTICS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = :tabel AND INDEX_NAME = :indeks'
    );
    $stmt->execute([
        ':tabel' => 'tbl_akun_pelanggan',
        ':indeks' => 'uq_akun_pelanggan_username',
    ]);
    if ((int) $stmt->fetchColumn() === 0) {
        $pdo->prepare(
            'ALTER TABLE tbl_akun_pelanggan
             ADD UNIQUE INDEX uq_akun_pelanggan_username (username)'
        )->execute();
    }

    siapkanDemoPelanggan();
}

/** Akun demo dibuat hanya jika belum tersedia, dengan hash PHP password_hash. */
function siapkanDemoPelanggan(): void
{
    global $pdo;

    $email = 'pelanggan@tokokita.test';
    $nomorHp = '081234567890';
    $stmt = $pdo->prepare(
        'SELECT id_akun, username FROM tbl_akun_pelanggan
         WHERE email = :email OR nomor_hp = :nomor_hp
         ORDER BY id_akun ASC LIMIT 1'
    );
    $stmt->execute([':email' => $email, ':nomor_hp' => $nomorHp]);
    $akun = $stmt->fetch();
    if ($akun !== false) {
        if ($akun['username'] === null || $akun['username'] === '') {
            $stmt = $pdo->prepare(
                'UPDATE tbl_akun_pelanggan
                 SET username = :username, password_hash = :password
                 WHERE id_akun = :id AND username IS NULL'
            );
            $stmt->execute([
                ':username' => 'user',
                ':password' => password_hash('123', PASSWORD_DEFAULT),
                ':id' => $akun['id_akun'],
            ]);
        }
        return;
    }

    $pdo->beginTransaction();
    try {
        $stmt = $pdo->prepare(
            'SELECT id_pelanggan FROM tbl_pelanggan
             WHERE email = :email OR nomor_hp = :nomor_hp
             ORDER BY id_pelanggan ASC LIMIT 1 FOR UPDATE'
        );
        $stmt->execute([':email' => $email, ':nomor_hp' => $nomorHp]);
        $idPelanggan = $stmt->fetchColumn();
        if ($idPelanggan === false) {
            $stmt = $pdo->prepare(
                'INSERT INTO tbl_pelanggan
                    (nama_pelanggan, kota, email, nomor_hp)
                 VALUES (:nama, NULL, :email, :nomor_hp)'
            );
            $stmt->execute([
                ':nama' => 'Pelanggan Demo',
                ':email' => $email,
                ':nomor_hp' => $nomorHp,
            ]);
            $idPelanggan = (int) $pdo->lastInsertId();
        } else {
            $stmt = $pdo->prepare(
                'UPDATE tbl_pelanggan
                 SET nama_pelanggan = :nama,
                     email = COALESCE(email, :email),
                     nomor_hp = COALESCE(nomor_hp, :nomor_hp)
                 WHERE id_pelanggan = :id'
            );
            $stmt->execute([
                ':nama' => 'Pelanggan Demo',
                ':email' => $email,
                ':nomor_hp' => $nomorHp,
                ':id' => $idPelanggan,
            ]);
        }

        $stmt = $pdo->prepare(
            'INSERT INTO tbl_akun_pelanggan
                (id_pelanggan, email, nomor_hp, username, password_hash)
             VALUES (:id_pelanggan, :email, :nomor_hp, :username, :password)'
        );
        $stmt->execute([
            ':id_pelanggan' => $idPelanggan,
            ':email' => $email,
            ':nomor_hp' => $nomorHp,
            ':username' => 'user',
            ':password' => password_hash('123', PASSWORD_DEFAULT),
        ]);
        $pdo->commit();
    } catch (PDOException $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        if ($e->getCode() === '23000') {
            $stmt = $pdo->prepare(
                'SELECT COUNT(*) FROM tbl_akun_pelanggan
                 WHERE email = :email OR nomor_hp = :nomor_hp'
            );
            $stmt->execute([':email' => $email, ':nomor_hp' => $nomorHp]);
            if ((int) $stmt->fetchColumn() > 0) {
                return;
            }
        }
        throw $e;
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        throw $e;
    }
}

/** Memulai sesi pembeli menggunakan cookie berbeda dari sesi Admin/Kasir. */
function mulaiSesiPelanggan(?bool $ingatSaya = null): void
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }

    $ingatSaya = $ingatSaya ?? (($_COOKIE['tokokita_customer_remember'] ?? '') === '1');
    ini_set('session.use_strict_mode', '1');
    ini_set('session.gc_maxlifetime', (string) ($ingatSaya ? 60 * 60 * 24 * 30 : 1440));
    session_name('tokokita_customer_session');
    session_set_cookie_params([
        'lifetime' => $ingatSaya ? 60 * 60 * 24 * 30 : 0,
        'path' => '/',
        'secure' => isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
    session_start();
}

/** Mengembalikan profil pembeli dari sesi khusus pelanggan. */
function pelangganSaatIni(): ?array
{
    global $pdo;

    mulaiSesiPelanggan();
    $idAkun = filter_var(
        $_SESSION['tokokita_customer_id'] ?? null,
        FILTER_VALIDATE_INT
    );
    if ($idAkun === false || $idAkun === null || $idAkun < 1) {
        return null;
    }

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
