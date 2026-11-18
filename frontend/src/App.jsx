import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import AuthGate from './components/AuthGate.jsx'
import RoleGate from './components/RoleGate.jsx'
import AppLayout from './layouts/AppLayout.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Kasir from './pages/Kasir.jsx'
import Keranjang from './pages/Keranjang.jsx'
import Laporan from './pages/Laporan.jsx'
import Log from './pages/Log.jsx'
import Login from './pages/Login.jsx'
import Produk from './pages/Produk.jsx'
import Pengguna from './pages/Pengguna.jsx'
import Transaksi from './pages/Transaksi.jsx'
import TransaksiBaru from './pages/TransaksiBaru.jsx'
import CustomerMasuk from './pages/CustomerMasuk.jsx'
import CustomerDaftar from './pages/CustomerDaftar.jsx'
import CustomerHomeRoute from './pages/CustomerHomeRoute.jsx'

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="login" element={<Login />} />
        <Route path="pelanggan/masuk" element={<CustomerMasuk />} />
        <Route path="pelanggan/daftar" element={<CustomerDaftar />} />
        <Route path="pelanggan" element={<CustomerHomeRoute />} />
        <Route element={<AuthGate><AppLayout /></AuthGate>}>
          <Route index element={<Dashboard />} />
          <Route path="produk" element={<Produk />} />
          <Route path="kasir" element={<Kasir />} />
          <Route path="pengguna" element={<RoleGate peran={['Admin']}><Pengguna /></RoleGate>} />
          <Route path="keranjang" element={<RoleGate peran={['Admin']}><Keranjang /></RoleGate>} />
          <Route path="transaksi" element={<Transaksi />} />
          <Route path="transaksi/baru" element={<RoleGate peran={['Admin']}><TransaksiBaru /></RoleGate>} />
          <Route path="laporan" element={<RoleGate peran={['Admin']}><Laporan /></RoleGate>} />
          <Route path="log" element={<RoleGate peran={['Admin']}><Log /></RoleGate>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}
