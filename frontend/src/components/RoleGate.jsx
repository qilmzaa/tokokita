import { useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { useToast } from './Toast'
import { useSession } from '../lib/session'

export default function RoleGate({ peran, children }) {
  const { pengguna } = useSession()
  const { info } = useToast()
  const diizinkan = pengguna && peran.includes(pengguna.peran)

  useEffect(() => {
    if (!diizinkan) info('Anda tidak memiliki akses.')
  }, [diizinkan, info])

  if (!diizinkan) {
    return <Navigate to="/kasir" replace />
  }

  return children
}
