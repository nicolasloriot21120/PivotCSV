// Thème sombre cohérent avec l'UI de l'app
export const theme = {
  background:  'transparent',
  textColor:   '#94a3b8',
  fontSize:    11,
  axis: {
    domain: { line: { stroke: '#334155', strokeWidth: 1 } },
    legend: { text: { fontSize: 11, fill: '#64748b' } },
    ticks:  {
      line: { stroke: '#334155', strokeWidth: 1 },
      text: { fontSize: 11, fill: '#94a3b8' },
    },
  },
  grid:    { line: { stroke: '#1e293b', strokeWidth: 1 } },
  legends: { text: { fontSize: 11, fill: '#94a3b8' } },
  tooltip: {
    container: {
      background:   '#0f172a',
      color:        '#e2e8f0',
      fontSize:     12,
      border:       '1px solid #334155',
      borderRadius: '6px',
      boxShadow:    '0 4px 12px rgba(0,0,0,0.4)',
    },
  },
}

// Palette Tableau-10 adaptée fond sombre — teintes désaturées, lisibilité éprouvée
export const COLORS = [
  '#5b9cf6',  // blue
  '#f5a623',  // amber
  '#3ecf8e',  // emerald
  '#f26868',  // coral
  '#a78bfa',  // violet
  '#22d3ee',  // cyan
  '#fb923c',  // orange
  '#c084fc',  // purple
  '#34d399',  // mint
  '#f472b6',  // rose
]

export const MARGIN = { top: 16, right: 16, bottom: 56, left: 56 }
