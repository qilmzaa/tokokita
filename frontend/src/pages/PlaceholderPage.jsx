import { ArrowLeft, Construction } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/Button'
import Card from '../components/Card'
import EmptyState from '../components/EmptyState'
import PageHeader from '../components/PageHeader'

export default function PlaceholderPage({
  title,
  description,
  icon: Ikon = Construction,
  eyebrow = 'Menu',
}) {
  const navigate = useNavigate()

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={eyebrow}
        title={title}
        description={description}
      />

      <Card className="border-dashed bg-white/70 dark:bg-slate-900/60">
        <EmptyState
          icon={Ikon}
          title={`Halaman ${title} segera hadir`}
          description="Halaman ini masih dalam tahap pengembangan. Untuk sementara, silakan kembali ke Dashboard untuk melihat ringkasan toko."
          action={
            <Button variant="secondary" onClick={() => navigate('/')}>
              <ArrowLeft size={16} />
              Kembali ke Dashboard
            </Button>
          }
          className="min-h-[380px]"
        />
      </Card>
    </div>
  )
}
