import { Printer, RotateCcw } from 'lucide-react'
import Button from './Button'
import Modal from './Modal'
import Struk, { cetakStruk } from './Struk'

export default function ReceiptModal({ transaksi, onTransaksiBaru }) {
  return (
    <Modal
      open={Boolean(transaksi)}
      onClose={onTransaksiBaru}
      title="Pembayaran berhasil"
      description="Transaksi tersimpan. Cetak struk atau mulai transaksi baru."
      footer={<>
        <Button variant="secondary" onClick={cetakStruk}><Printer size={16} />Cetak</Button>
        <Button onClick={onTransaksiBaru}><RotateCcw size={16} />Transaksi Baru</Button>
      </>}
    >
      {transaksi && <Struk transaksi={transaksi} tampilkanKontrol={false} />}
    </Modal>
  )
}
