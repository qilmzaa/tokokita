const FORMAT_FOTO_DITERIMA = ['image/jpeg', 'image/png', 'image/webp']
const UKURAN_MAKS_FOTO = 2 * 1024 * 1024
const SISI_MAKS_FOTO = 600
const KUALITAS_FOTO = 0.8

/**
 * Memvalidasi berkas foto sebelum diproses. Mengembalikan pesan galat
 * berbahasa Indonesia, atau string kosong bila berkas sah.
 */
export function validasiBerkasFoto(berkas) {
  if (!berkas) return ''

  if (!FORMAT_FOTO_DITERIMA.includes(berkas.type)) {
    return 'Format foto harus JPG, PNG, atau WEBP.'
  }

  if (berkas.size > UKURAN_MAKS_FOTO) {
    return 'Ukuran foto maksimal 2 MB.'
  }

  return ''
}

function bacaDataUrl(berkas) {
  return new Promise((selesai, gagal) => {
    const pembaca = new FileReader()

    pembaca.onload = () => selesai(pembaca.result)
    pembaca.onerror = () => gagal(new Error('Foto gagal dibaca.'))
    pembaca.readAsDataURL(berkas)
  })
}

function muatGambar(dataUrl) {
  return new Promise((selesai, gagal) => {
    const gambar = new Image()

    gambar.onload = () => selesai(gambar)
    gambar.onerror = () => gagal(new Error('Foto gagal diproses.'))
    gambar.src = dataUrl
  })
}

/**
 * Memperkecil gambar di sisi klien: sisi terpanjang maksimal 600 px,
 * kualitas JPEG sekitar 0.8. Mengembalikan Data URL berformat image/jpeg.
 */
export async function kompresGambar(berkas) {
  const dataUrl = await bacaDataUrl(berkas)
  const gambar = await muatGambar(dataUrl)

  const skala = Math.min(
    1,
    SISI_MAKS_FOTO / Math.max(gambar.width, gambar.height),
  )
  const lebar = Math.max(1, Math.round(gambar.width * skala))
  const tinggi = Math.max(1, Math.round(gambar.height * skala))

  const kanvas = document.createElement('canvas')
  kanvas.width = lebar
  kanvas.height = tinggi

  const konteks = kanvas.getContext('2d')
  konteks.fillStyle = '#ffffff'
  konteks.fillRect(0, 0, lebar, tinggi)
  konteks.drawImage(gambar, 0, 0, lebar, tinggi)

  return kanvas.toDataURL('image/jpeg', KUALITAS_FOTO)
}

/** Mengubah Data URL menjadi objek File agar dapat dikirim sebagai unggahan. */
export async function dataUrlKeBerkas(dataUrl, nama = 'foto.jpg') {
  const respons = await fetch(dataUrl)
  const blob = await respons.blob()

  return new File([blob], nama, { type: blob.type || 'image/jpeg' })
}
