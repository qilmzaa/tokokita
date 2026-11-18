import { useEffect, useState } from 'react'
import { KeyRound, Pencil, Plus, Search, ShieldCheck, Trash2, UserRoundX } from 'lucide-react'
import Badge from '../components/Badge'
import Button from '../components/Button'
import Card from '../components/Card'
import EmptyState from '../components/EmptyState'
import Modal from '../components/Modal'
import PageHeader from '../components/PageHeader'
import Skeleton from '../components/Skeleton'
import { useToast } from '../components/Toast'
import { ambilData } from '../lib/api'
import { formatWaktu } from '../lib/format'
import { useSession } from '../lib/session'

const formAwal = { nama_lengkap: '', username: '', peran: 'Kasir', password: '' }
const inputClass = 'h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white'

function inisial(nama) {
  return String(nama || '?').trim().split(/\s+/).slice(0, 2).map((bagian) => bagian[0]).join('').toUpperCase()
}

export default function Pengguna() {
  const [daftar, setDaftar] = useState([])
  const [memuat, setMemuat] = useState(true)
  const [galat, setGalat] = useState('')
  const [kataKunci, setKataKunci] = useState('')
  const [peranFilter, setPeranFilter] = useState('')
  const [versi, setVersi] = useState(0)
  const [mode, setMode] = useState('')
  const [pilihan, setPilihan] = useState(null)
  const [form, setForm] = useState(formAwal)
  const [galatForm, setGalatForm] = useState('')
  const [menyimpan, setMenyimpan] = useState(false)
  const [targetHapus, setTargetHapus] = useState(null)
  const [menghapus, setMenghapus] = useState(false)
  const { pengguna } = useSession()
  const { sukses, gagal } = useToast()

  useEffect(() => {
    let aktif = true
    const timer = window.setTimeout(() => {
      const parameter = new URLSearchParams()
      if (kataKunci.trim()) parameter.set('q', kataKunci.trim())
      if (peranFilter) parameter.set('peran', peranFilter)
      setMemuat(true)
      setGalat('')
      ambilData(`/api/pengguna.php${parameter.size ? `?${parameter}` : ''}`)
        .then((hasil) => { if (aktif) setDaftar(hasil?.data ?? []) })
        .catch((error) => { if (aktif) setGalat(error.message || 'Gagal memuat pengguna.') })
        .finally(() => { if (aktif) setMemuat(false) })
    }, 180)

    return () => {
      aktif = false
      window.clearTimeout(timer)
    }
  }, [kataKunci, peranFilter, versi])

  function bukaForm(pengguna = null) {
    setPilihan(pengguna)
    setMode('form')
    setForm(pengguna
      ? { nama_lengkap: pengguna.nama_lengkap, username: pengguna.username, peran: pengguna.peran, password: '' }
      : formAwal)
    setGalatForm('')
  }

  function bukaReset(pengguna) {
    setPilihan(pengguna)
    setMode('password')
    setForm({ ...formAwal, password: '' })
    setGalatForm('')
  }

  async function simpan(event) {
    event.preventDefault()
    if (menyimpan) return

    if (mode !== 'password' && !form.nama_lengkap.trim()) return setGalatForm('Nama lengkap wajib diisi.')
    if (mode !== 'password' && (!form.username.trim() || /\s/.test(form.username.trim()))) return setGalatForm('Username wajib diisi dan tidak boleh mengandung spasi.')
    if ((mode === 'password' || !pilihan) && form.password.length < 6) return setGalatForm('Kata sandi minimal 6 karakter.')

    setMenyimpan(true)
    setGalatForm('')
    try {
      const buat = !pilihan
      const reset = mode === 'password'
      await ambilData(`/api/pengguna.php${pilihan ? `?id=${pilihan.id_pengguna}` : ''}`, {
        method: buat ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reset
          ? { action: 'reset_password', password: form.password }
          : { nama_lengkap: form.nama_lengkap, username: form.username, peran: form.peran, password: form.password }),
      })
      sukses(reset ? 'Kata sandi berhasil direset.' : buat ? 'Pengguna berhasil ditambahkan.' : 'Data pengguna berhasil diperbarui.')
      setMode('')
      setVersi((nilai) => nilai + 1)
    } catch (error) {
      setGalatForm(error.message || 'Gagal menyimpan data pengguna.')
    } finally {
      setMenyimpan(false)
    }
  }

  async function ubahStatus(pengguna) {
    try {
      const status = !pengguna.status_aktif
      await ambilData(`/api/pengguna.php?id=${pengguna.id_pengguna}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'status', status_aktif: status }),
      })
      sukses(status ? 'Pengguna berhasil diaktifkan.' : 'Pengguna berhasil dinonaktifkan.')
      setVersi((nilai) => nilai + 1)
    } catch (error) {
      gagal(error.message || 'Gagal mengubah status pengguna.')
    }
  }

  async function hapus() {
    if (!targetHapus || menghapus) return
    setMenghapus(true)
    try {
      await ambilData(`/api/pengguna.php?id=${targetHapus.id_pengguna}`, { method: 'DELETE' })
      sukses('Pengguna berhasil dihapus.')
      setTargetHapus(null)
      setVersi((nilai) => nilai + 1)
    } catch (error) {
      gagal(error.message || 'Gagal menghapus pengguna.')
    } finally {
      setMenghapus(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Pengaturan"
        title="Pengguna"
        description="Kelola akun, peran, dan status akses pengguna toko."
        action={<Button onClick={() => bukaForm()}><Plus size={16} />Tambah Pengguna</Button>}
      />

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-200/80 p-4 dark:border-slate-800 sm:flex-row sm:items-center">
          <label className="relative flex-1">
            <span className="sr-only">Cari nama atau username</span>
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={kataKunci} onChange={(event) => setKataKunci(event.target.value)} placeholder="Cari nama atau username..." className={`${inputClass} pl-9`} />
          </label>
          <select aria-label="Filter peran" value={peranFilter} onChange={(event) => setPeranFilter(event.target.value)} className={`${inputClass} sm:w-44`}>
            <option value="">Semua peran</option>
            <option value="Admin">Admin</option>
            <option value="Kasir">Kasir</option>
          </select>
        </div>

        {memuat ? (
          <div className="space-y-3 p-5" aria-busy="true">
            {[1, 2, 3].map((item) => <Skeleton key={item} className="h-14 w-full" />)}
          </div>
        ) : galat ? (
          <p role="alert" className="p-8 text-center text-sm text-rose-600 dark:text-rose-300">{galat}</p>
        ) : daftar.length === 0 ? (
          <EmptyState icon={UserRoundX} title="Pengguna tidak ditemukan" description="Coba ubah kata pencarian atau filter peran." className="py-12" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead><tr className="bg-slate-50/80 text-xs uppercase tracking-wider text-slate-500 dark:bg-slate-800/40 dark:text-slate-400">
                <th className="px-5 py-3 font-medium">Pengguna</th>
                <th className="px-5 py-3 font-medium">Username</th>
                <th className="px-5 py-3 font-medium">Peran</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Tanggal dibuat</th>
                <th className="px-5 py-3 text-right font-medium">Aksi</th>
              </tr></thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {daftar.map((item) => {
                  const milikSaya = item.id_pengguna === pengguna?.id_pengguna
                  return (
                    <tr key={item.id_pengguna}>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 text-xs font-semibold text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">{inisial(item.nama_lengkap)}</span>
                          <span className="font-medium text-slate-800 dark:text-slate-100">{item.nama_lengkap}{milikSaya && <span className="ml-2 text-xs text-slate-400">(Anda)</span>}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300">{item.username}</td>
                      <td className="px-5 py-3.5"><Badge variant={item.peran === 'Admin' ? 'indigo' : 'slate'}>{item.peran}</Badge></td>
                      <td className="px-5 py-3.5"><Badge variant={item.status_aktif ? 'emerald' : 'rose'}>{item.status_aktif ? 'Aktif' : 'Nonaktif'}</Badge></td>
                      <td className="px-5 py-3.5 text-xs text-slate-500 dark:text-slate-400">{formatWaktu(item.dibuat_pada)}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon-sm" title="Ubah pengguna" aria-label={`Ubah ${item.nama_lengkap}`} onClick={() => bukaForm(item)}><Pencil size={15} /></Button>
                          <Button variant="ghost" size="icon-sm" title="Reset kata sandi" aria-label={`Reset kata sandi ${item.nama_lengkap}`} onClick={() => bukaReset(item)}><KeyRound size={15} /></Button>
                          <Button variant="ghost" size="icon-sm" title={item.status_aktif ? 'Nonaktifkan' : 'Aktifkan'} aria-label={`${item.status_aktif ? 'Nonaktifkan' : 'Aktifkan'} ${item.nama_lengkap}`} disabled={milikSaya} onClick={() => ubahStatus(item)}>{item.status_aktif ? <UserRoundX size={15} /> : <ShieldCheck size={15} />}</Button>
                          <Button variant="dangerGhost" size="icon-sm" title="Hapus pengguna" aria-label={`Hapus ${item.nama_lengkap}`} disabled={milikSaya} onClick={() => setTargetHapus(item)}><Trash2 size={15} /></Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        open={mode !== ''}
        onClose={() => !menyimpan && setMode('')}
        title={mode === 'password' ? 'Reset kata sandi' : pilihan ? 'Ubah pengguna' : 'Tambah pengguna'}
        description={mode === 'password' ? `Tetapkan kata sandi baru untuk ${pilihan?.nama_lengkap}.` : 'Isi informasi akun pengguna.'}
        footer={<><Button variant="secondary" onClick={() => setMode('')} disabled={menyimpan}>Batal</Button><Button type="submit" form="form-pengguna" disabled={menyimpan}>{menyimpan ? 'Menyimpan...' : mode === 'password' ? 'Simpan kata sandi' : 'Simpan'}</Button></>}
      >
        <form id="form-pengguna" onSubmit={simpan} className="space-y-4">
          {mode !== 'password' && <>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Nama lengkap<input autoFocus className={`${inputClass} mt-1.5`} value={form.nama_lengkap} onChange={(event) => setForm({ ...form, nama_lengkap: event.target.value })} /></label>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Username<input className={`${inputClass} mt-1.5`} value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} autoComplete="off" /></label>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Peran<select className={`${inputClass} mt-1.5`} value={form.peran} onChange={(event) => setForm({ ...form, peran: event.target.value })}><option>Kasir</option><option>Admin</option></select></label>
          </>}
          {(!pilihan || mode === 'password') && <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Kata sandi baru<input type="password" autoComplete="new-password" className={`${inputClass} mt-1.5`} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /></label>}
          {pilihan && mode === 'form' && <p className="text-xs text-slate-500 dark:text-slate-400">Untuk mengubah kata sandi, gunakan tombol reset pada daftar pengguna.</p>}
          {galatForm && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">{galatForm}</p>}
        </form>
      </Modal>

      <Modal open={Boolean(targetHapus)} onClose={() => !menghapus && setTargetHapus(null)} title="Hapus pengguna" description={`Yakin ingin menghapus akun ${targetHapus?.nama_lengkap}? Akun tidak dapat digunakan lagi.`} footer={<><Button variant="secondary" onClick={() => setTargetHapus(null)} disabled={menghapus}>Batal</Button><Button variant="danger" onClick={hapus} disabled={menghapus}>{menghapus ? 'Menghapus...' : 'Hapus pengguna'}</Button></>}>
        <p className="text-sm text-slate-600 dark:text-slate-300">Data transaksi sebelumnya tetap tersimpan.</p>
      </Modal>
    </div>
  )
}
