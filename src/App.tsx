import { Plus, Upload, Trash2, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card }   from '@/components/ui/Card'
import { Badge }  from '@/components/ui/Badge'

export default function App() {
  return (
    <div className="min-h-screen p-10 flex flex-col gap-10">

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-bold text-text mb-1">PivotCSV</h1>
          <p className="text-muted text-sm">Design system — aperçu des composants</p>
        </div>
        <div className="flex items-center gap-2 opacity-50 hover:opacity-90 transition-opacity">
          <img src="/finex-icon-light.svg" alt="Finex" className="h-7 w-auto" />
          <span className="text-text text-base font-semibold tracking-tight">Finex</span>
        </div>
      </div>

      <section className="flex flex-col gap-4">
        <h2 className="text-xs uppercase tracking-widest text-muted font-semibold">Button</h2>
        <div className="flex flex-wrap gap-3 items-center">
          <Button variant="primary"   icon={<Plus size={15} />}>Nouveau rapport</Button>
          <Button variant="secondary" icon={<Upload size={15} />}>Importer CSV</Button>
          <Button variant="ghost"     iconEnd={<ChevronRight size={14} />}>Voir plus</Button>
          <Button variant="danger"    icon={<Trash2 size={14} />}>Supprimer</Button>
          <Button variant="primary"   loading>Chargement</Button>
          <Button variant="secondary" size="sm">Petit</Button>
          <Button variant="primary"   size="lg">Grand</Button>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xs uppercase tracking-widest text-muted font-semibold">Card</h2>
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <p className="text-sm text-text font-semibold mb-1">Surface</p>
            <p className="text-xs text-muted">Carte standard</p>
          </Card>
          <Card elevated>
            <p className="text-sm text-text font-semibold mb-1">Elevated</p>
            <p className="text-xs text-muted">Ombre renforcée</p>
          </Card>
          <Card glow>
            <p className="text-sm text-text font-semibold mb-1">Glow</p>
            <p className="text-xs text-muted">Halo accent</p>
          </Card>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xs uppercase tracking-widest text-muted font-semibold">Badge</h2>
        <div className="flex flex-wrap gap-2 items-center">
          <Badge variant="accent"  dot>Accent</Badge>
          <Badge variant="success" dot>Succès</Badge>
          <Badge variant="warning" dot>Attention</Badge>
          <Badge variant="danger"  dot>Erreur</Badge>
          <Badge variant="neutral">Neutre</Badge>
        </div>
      </section>

    </div>
  )
}
