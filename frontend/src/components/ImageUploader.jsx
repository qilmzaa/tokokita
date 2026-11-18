import { ImagePlus, Loader2, Trash2, TriangleAlert, UploadCloud } from 'lucide-react'
import { useRef, useState } from 'react'
import Button from './Button'
import { kompresGambar, validasiBerkasFoto } from '../lib/gambar'

/**
 * Pengunggah foto produk: klik atau seret berkas, validasi format/ukuran,
 * lalu perkecil di sisi klien sebelum ditampilkan sebagai pratinjau Data URL.
 */
export default function ImageUploader({ value, onChange, disabled = false }) {
  const inputRef = useRef(null)
  const [memproses, setMemproses] = useState(false)
  const [galat, setGalat] = useState('')
  const [sedangSeret, setSedangSeret] = useState(false)

  async function prosesBerkas(berkas) {
    if (disabled || memproses) return

    setGalat('')

    const pesanGalat = validasiBerkasFoto(berkas)
    if (pesanGalat !== '') {
      setGalat(pesanGalat)
      return
    }

    setMemproses(true)

    try {
      onChange(await kompresGambar(berkas))
    } catch (error) {
      setGalat(
        error instanceof Error ? error.message : 'Foto gagal diproses.',
      )
    } finally {
      setMemproses(false)
    }
  }

  function pilihBerkas(event) {
    const berkas = event.target.files?.[0]
    event.target.value = ''
    void prosesBerkas(berkas)
  }

  function lepasSeret(event) {
    event.preventDefault()
    event.stopPropagation()
    setSedangSeret(false)
  }

  async function terimaSeret(event) {
    event.preventDefault()
    event.stopPropagation()
    setSedangSeret(false)
    await prosesBerkas(event.dataTransfer?.files?.[0])
  }

  function hapusFoto() {
    setGalat('')
    onChange('')
  }

  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
        Foto <span className="text-xs font-normal text-slate-400 dark:text-slate-500">(opsional)</span>
      </span>

      <div
        onDragOver={(event) => {
          event.preventDefault()
          if (!disabled && !memproses) setSedangSeret(true)
        }}
        onDragLeave={lepasSeret}
        onDrop={terimaSeret}
        className={`relative overflow-hidden rounded-xl border-2 border-dashed transition-colors ${
          sedangSeret
            ? 'border-indigo-500 bg-indigo-50/60 dark:border-indigo-400 dark:bg-indigo-500/10'
            : 'border-slate-300 bg-slate-50/60 dark:border-slate-700 dark:bg-slate-950/40'
        }`}
      >
        {value ? (
          <div className="flex items-center gap-3 p-3">
            <img
              src={value}
              alt="Pratinjau foto produk"
              className="h-24 w-24 shrink-0 rounded-lg bg-slate-100 object-cover dark:bg-slate-800"
            />
            <div className="min-w-0 flex-1 space-y-2">
              <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                Foto produk siap disimpan. Gunakan tombol di bawah untuk
                mengganti atau menghapusnya.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => inputRef.current?.click()}
                  disabled={disabled || memproses}
                >
                  <ImagePlus size={15} />
                  Ganti Foto
                </Button>
                <Button
                  variant="dangerGhost"
                  size="sm"
                  onClick={hapusFoto}
                  disabled={disabled || memproses}
                >
                  <Trash2 size={15} />
                  Hapus Foto
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={disabled || memproses}
            className="flex w-full flex-col items-center justify-center gap-2 px-4 py-8 text-center disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
              {memproses ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <UploadCloud size={20} />
              )}
            </span>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
              {memproses ? 'Memproses foto...' : 'Klik atau seret foto ke sini'}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              JPG, PNG, atau WEBP · maksimal 2 MB · diperkecil otomatis ke 600 px
            </span>
          </button>
        )}

        {memproses && value && (
          <div className="absolute inset-0 z-10 flex items-center justify-center gap-2 bg-white/80 text-sm font-medium text-slate-700 dark:bg-slate-950/80 dark:text-slate-200">
            <Loader2 size={16} className="animate-spin" />
            Memproses foto...
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={pilihBerkas}
      />

      {galat && (
        <p
          role="alert"
          className="mt-2 flex items-start gap-1.5 text-xs leading-relaxed text-rose-600 dark:text-rose-400"
        >
          <TriangleAlert size={14} className="mt-0.5 shrink-0" />
          <span>{galat}</span>
        </p>
      )}
    </div>
  )
}
