import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import AuthGate from './components/AuthGate.jsx'
import AppLayout from './layouts/AppLayout.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Laporan from './pages/Laporan.jsx'
import Log from './pages/Log.jsx'
import Login from './pages/Login.jsx'
import Pelanggan from './pages/Pelanggan.jsx'
import Produk from './pages/Produk.jsx'
import Transaksi from './pages/Transaksi.jsx'
import TransaksiBaru from './pages/TransaksiBaru.jsx'

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="login" element={<Login />} />
        <Route element={<AuthGate><AppLayout /></AuthGate>}>
          <Route index element={<Dashboard />} />
          <Route path="pelanggan" element={<Pelanggan />} />
          <Route path="produk" element={<Produk />} />
          <Route path="transaksi" element={<Transaksi />} />
          <Route path="transaksi/baru" element={<TransaksiBaru />} />
          <Route path="laporan" element={<Laporan />} />
          <Route path="log" element={<Log />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}
