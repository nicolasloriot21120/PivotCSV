import type { Section } from '@/types/app'

type Props = {
  sections:     Section[]
  isSelected:   (sectionId: string, type: 'table' | 'chart') => boolean
  onToggle:     (sectionId: string, type: 'table' | 'chart') => void
  onAddComment: () => void
}

export function BlockSelector({ sections, isSelected, onToggle, onAddComment }: Props) {
  return (
    <div className="flex flex-col gap-4">
      {sections.map(section => {
        const hasResult = section.result !== null
        return (
          <div key={section.id}>
            <p className={[
              'text-sm font-medium mb-1',
              hasResult ? 'text-slate-200' : 'text-slate-600',
            ].join(' ')}>
              {section.label}
            </p>
            <div className="flex flex-col gap-1 pl-2">
              {(['table', 'chart'] as const).map(type => (
                <label
                  key={type}
                  className={[
                    'flex items-center gap-2 text-xs cursor-pointer',
                    hasResult ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 cursor-default',
                  ].join(' ')}
                >
                  <input
                    type="checkbox"
                    disabled={!hasResult}
                    checked={hasResult && isSelected(section.id, type)}
                    onChange={() => hasResult && onToggle(section.id, type)}
                    className="accent-blue-500"
                  />
                  {type === 'table' ? 'Tableau' : 'Graphique'}
                </label>
              ))}
            </div>
          </div>
        )
      })}

      <button
        onClick={onAddComment}
        className="mt-2 text-xs text-slate-400 hover:text-slate-200 transition-colors text-left"
      >
        ＋ Zone de commentaire
      </button>
    </div>
  )
}
