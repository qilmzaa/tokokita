const formatterRupiah = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

const formatterAngka = new Intl.NumberFormat('id-ID')

/**
 * Memformat angka menjadi rupiah, contoh: Rp1.607.850.
 */
export function formatRupiah(nilai) {
  const angka = Number(nilai)
  return formatterRupiah.format(Number.isFinite(angka) ? angka : 0)
}

/**
 * Memformat angka dengan pemisah ribuan, contoh: 1.607.850.
 */
export function formatAngka(nilai) {
  const angka = Number(nilai)
  return formatterAngka.format(Number.isFinite(angka) ? angka : 0)
}

/**
 * Format ringkas untuk sumbu grafik, contoh: 225 rb, 1,6 jt.
 */
export function formatRupiahRingkas(nilai) {
  const angka = Number(nilai) || 0
  const ringkas = (n, satuan) =>
    `${new Intl.NumberFormat('id-ID', { maximumFractionDigits: 1 }).format(n)} ${satuan}`

  if (Math.abs(angka) >= 1_000_000_000) {
    return ringkas(angka / 1_000_000_000, 'M')
  }
  if (Math.abs(angka) >= 1_000_000) {
    return ringkas(angka / 1_000_000, 'jt')
  }
  if (Math.abs(angka) >= 1_000) {
    return `${Math.round(angka / 1_000)} rb`
  }
  return String(angka)
}

function keTanggal(nilai) {
  if (!nilai) return null
  const tanggal = new Date(`${String(nilai).slice(0, 10)}T00:00:00`)
  return Number.isNaN(tanggal.getTime()) ? null : tanggal
}

/**
 * Format tanggal lengkap berbahasa Indonesia, contoh: 16 November 2026.
 */
export function formatTanggal(nilai) {
  const tanggal = keTanggal(nilai)
  if (!tanggal) return '—'

  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(tanggal)
}

/**
 * Format tanggal pendek untuk grafik, contoh: 16 Nov.
 */
export function formatTanggalPendek(nilai) {
  const tanggal = keTanggal(nilai)
  if (!tanggal) return '—'

  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
  }).format(tanggal)
}

/**
 * Format tanggal dan waktu lengkap, contoh: 16 Nov 2026, 09.58.34.
 */
export function formatWaktu(nilai) {
  if (!nilai) return '—'

  const waktu = new Date(String(nilai).trim().replace(' ', 'T'))

  if (Number.isNaN(waktu.getTime())) return '—'

  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'medium',
  }).format(waktu)
}
