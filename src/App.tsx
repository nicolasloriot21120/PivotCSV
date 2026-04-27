import { useState } from 'react'
import { Plus, Upload, Trash2, ChevronRight, ChevronsUpDown } from 'lucide-react'
import { Button }       from '@/components/ui/Button'
import { Card }         from '@/components/ui/Card'
import { Badge }        from '@/components/ui/Badge'
import { FileDropzone } from '@/components/ui/FileDropzone'
import { CSVLoader }    from '@/lib/loader'
import type { RawRow, LoadResult } from '@/lib/loader'

const PREVIEW_ROWS = 3
const loader = new CSVLoader()

export default function App() {
  const [_files,   setFiles]   = useState<File[]>([])
  const [result,   setResult]  = useState<LoadResult<RawRow> | null>(null)
  const [expanded, setExpanded] = useState(false)

  async function handleFiles(newFiles: File[]) {
    setFiles(newFiles)
    setExpanded(false)
    if (newFiles.length === 0) { setResult(null); return }
    const res = await loader.load(newFiles[0])
    setResult(res)
  }

  return (
    <div className="min-h-screen p-10 flex flex-col gap-10">

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-bold text-text mb-1">PivotCSV</h1>
          <p className="text-muted text-sm">Design system — aperçu des composants</p>
        </div>
        <img src="/finex-icon-dark.svg" alt="Finex" className="h-15 w-auto opacity-65 hover:opacity-90 transition-opacity" />
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

      <section className="flex flex-col gap-4">
        <h2 className="text-xs uppercase tracking-widest text-muted font-semibold">FileDropzone</h2>
        <div className="max-w-lg flex flex-col gap-4">
          <FileDropzone accept=".csv" multiple onFiles={handleFiles} />

          {result && (
            <Card elevated padding="none">
              <button
                onClick={() => setExpanded(e => !e)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] transition-colors rounded-[var(--radius-lg)]"
              >
                <div className="flex items-center gap-3">
                  <ChevronsUpDown size={14} className="text-muted flex-shrink-0" />
                  <span className="text-sm text-text font-semibold">
                    {result.data.length.toLocaleString('fr-FR')} lignes
                    — {Object.keys(result.data[0] ?? {}).length} colonnes
                  </span>
                </div>
                <Badge variant={result.ok ? 'success' : 'danger'} dot>
                  {result.ok ? 'Valide' : 'Erreurs'}
                </Badge>
              </button>

              {expanded && (
                <div className="px-4 pb-4 flex flex-col gap-3">
                  {result.errors.length > 0 && (
                    <ul className="flex flex-col gap-1">
                      {result.errors.map((e, i) => (
                        <li key={i} className="text-xs text-warning">
                          {e.row ? `Ligne ${e.row} : ` : ''}{e.message}
                        </li>
                      ))}
                    </ul>
                  )}

                  <div className="overflow-x-auto rounded-[var(--radius-md)] border border-border">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-elevated border-b border-border">
                          {Object.keys(result.data[0] ?? {}).map(h => (
                            <th key={h} className="px-3 py-2 text-left text-muted font-medium whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {result.data.slice(0, PREVIEW_ROWS).map((row, i) => (
                          <tr key={i} className="border-b border-border/50 last:border-0">
                            {Object.values(row).map((v, j) => (
                              <td key={j} className="px-3 py-1.5 text-text/80 whitespace-nowrap">{String(v ?? '')}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </Card>
          )}
        </div>
      </section>

    </div>
  )
}
