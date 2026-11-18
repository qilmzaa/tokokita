import { useEffect, useState } from 'react'

const KUNCI_KERANJANG = 'tokokita_keranjang'
const NAMA_KEJADIAN = 'keranjang-berubah'

/**
 * Membaca isi keranjang dari localStorage dan membuang data yang tidak valid.
 */
function bacaPenyimpanan() {
  try {
    const teks = window.localStorage.getItem(KUNCI_KERANJANG)

    if (!teks) return []

    const data = JSON.parse(teks)

    if (!Array.isArray(data)) return []

    return data
      .map((item) => ({
        id_produk: Number(item?.id_produk),
        jumlah: Number(item?.jumlah),
        diskon_persen: Number(item?.diskon_persen ?? 0),
      }))
      .filter(
        (item) =>
          Number.isInteger(item.id_produk) &&
          item.id_produk > 0 &&
          Number.isFinite(item.jumlah) &&
          item.jumlah > 0 &&
          Number.isFinite(item.diskon_persen) &&
          item.diskon_persen >= 0 &&
          item.diskon_persen <= 100,
      )
  } catch {
    return []
  }
}

/**
 * Menyimpan isi keranjang dan memberi tahu seluruh halaman yang berlangganan.
 */
function tulisPenyimpanan(items) {
  try {
    window.localStorage.setItem(KUNCI_KERANJANG, JSON.stringify(items))
  } catch {
    // Abaikan bila penyimpanan browser tidak tersedia.
  }

  window.dispatchEvent(new Event(NAMA_KEJADIAN))
}

/** Menambahkan produk ke keranjang, atau menambah jumlah bila sudah ada. */
export function tambahKeKeranjang(idProduk, jumlah = 1) {
  const tambahan = Math.max(1, Math.floor(Number(jumlah) || 1))
  const items = bacaPenyimpanan()
  const index = items.findIndex((item) => item.id_produk === Number(idProduk))

  if (index >= 0) {
    items[index] = { ...items[index], jumlah: items[index].jumlah + tambahan }
  } else {
    items.push({
      id_produk: Number(idProduk),
      jumlah: tambahan,
      diskon_persen: 0,
    })
  }

  tulisPenyimpanan(items)
}

/** Mengubah jumlah sebuah produk di keranjang (minimal 1). */
export function ubahJumlahKeranjang(idProduk, jumlah) {
  const items = bacaPenyimpanan()
  const index = items.findIndex((item) => item.id_produk === Number(idProduk))

  if (index < 0) return

  const nilai = Math.floor(Number(jumlah))

  items[index] = {
    ...items[index],
    jumlah: Number.isFinite(nilai) && nilai > 0 ? nilai : 1,
  }

  tulisPenyimpanan(items)
}

/** Mengubah diskon persen sebuah produk di keranjang (0 sampai 100). */
export function ubahDiskonKeranjang(idProduk, diskon) {
  const items = bacaPenyimpanan()
  const index = items.findIndex((item) => item.id_produk === Number(idProduk))

  if (index < 0) return

  const nilai = Number(diskon)
  const persen = Number.isFinite(nilai) ? Math.min(Math.max(nilai, 0), 100) : 0

  items[index] = { ...items[index], diskon_persen: persen }

  tulisPenyimpanan(items)
}

/** Menghapus sebuah produk dari keranjang. */
export function hapusDariKeranjang(idProduk) {
  tulisPenyimpanan(
    bacaPenyimpanan().filter((item) => item.id_produk !== Number(idProduk)),
  )
}

/** Mengosongkan seluruh isi keranjang. */
export function kosongkanKeranjang() {
  tulisPenyimpanan([])
}

/**
 * Hook berlangganan isi keranjang. Diperbarui setiap keranjang berubah,
 * termasuk perubahan yang datang dari tab lain.
 */
export function useKeranjang() {
  const [items, setItems] = useState(bacaPenyimpanan)

  useEffect(() => {
    function perbarui() {
      setItems(bacaPenyimpanan())
    }

    window.addEventListener(NAMA_KEJADIAN, perbarui)
    window.addEventListener('storage', perbarui)

    return () => {
      window.removeEventListener(NAMA_KEJADIAN, perbarui)
      window.removeEventListener('storage', perbarui)
    }
  }, [])

  return items
}
