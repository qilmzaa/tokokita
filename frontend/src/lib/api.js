/**
 * Mengambil data JSON dari API. Melempar Error berisi pesan dari server
 * bila respons bukan 2xx atau bukan JSON yang valid.
 */
export async function ambilData(url, opsi = {}) {
  let respons

  try {
    respons = await fetch(url, {
      ...opsi,
      headers: { Accept: 'application/json', ...opsi.headers },
    })
  } catch {
    throw new Error('Tidak dapat terhubung ke server. Periksa koneksi Anda.')
  }

  let data = null

  try {
    data = await respons.json()
  } catch {
    throw new Error('Respons server tidak valid.')
  }

  if (!respons.ok) {
    throw new Error(data?.error || 'Terjadi kesalahan saat memuat data.')
  }

  return data
}
