# PivotCSV — CLAUDE.md

## Stack

- React 19 + Vite 8 + TypeScript
- Tailwind v4 (pas de `tailwind.config.js`)
- @dnd-kit/core + @dnd-kit/sortable — drag-and-drop sections
- Recharts — graphiques (BarChart, LineChart, PieChart)
- @react-pdf/renderer — export PDF (import dynamique obligatoire, voir ci-dessous)
- html2canvas-pro — capture DOM (html2canvas standard ne supporte pas Tailwind v4)
- Alias `@` → `src/`

---

## Conventions dossiers

Chaque composant complexe suit cette structure :

```
ComponentName/
  index.tsx          ← seul fichier à la racine
  components/        ← sous-composants locaux
  hooks/             ← hooks locaux
  types/             ← types locaux (index.ts)
  lib/               ← utilitaires locaux
```

---

## Points de vigilance

### html2canvas-pro (pas html2canvas)
Tailwind v4 génère des couleurs `oklab()` que `html2canvas` ne sait pas parser → erreur à l'exécution.
Toujours importer `html2canvas-pro` à la place.

### @react-pdf/renderer — import dynamique obligatoire
Le package a un sous-dépendance CJS (`base64-js`) qui provoque une erreur Vite au chargement de page si importé statiquement.
**Ne jamais importer en haut de fichier.** Toujours en dynamique :
```ts
const { buildAndDownloadPdf } = await import('../lib/buildPdf')
```

### data-export-target
Les containers tableau et graphique ont `data-export-target="${sectionId}-table"` et `data-export-target="${sectionId}-chart"`.
`captureBlocks.ts` les utilise pour html2canvas. Ne pas retirer ces attributs.

---

## Types clés

### DimField
```ts
type DimField = { field: string; dateGroup?: DateGrouping }
```
Remplace `string[]` pour `rows` et `columns` dans `PivotConfig`. Les anciens configs persistés (string[]) sont migrés au chargement via `normalizeConfig()` dans `useReportPage.ts`.

### Section (`src/types/app.ts`)
Contient config, result (PivotData | null), status, chartType, chartLayout, tableFlex, chartFlex, chartTranspose, etc.

---

## Architecture

### ReportPage
Page principale. State géré par `useReportPage` (fichiers + sections + workers).
- `fileEntries` — fichiers CSV chargés
- `sections` — pivots configurés/calculés
- State persisté dans IndexedDB via `src/lib/persistence.ts`

### Calcul pivot
Web Worker (`src/lib/pivot/worker.ts`) — un seul worker actif à la fois.
Pour calcul séquentiel (mode présentation), voir `computeNextInQueue` dans `useReportPage.ts`.

### Mode présentation
Overlay full-screen sur ReportPage (pas de route séparée — pour conserver la state React).
- `openPresentation()` calcule d'abord toutes les sections non calculées (séquentiellement)
- Loader pendant le calcul, puis `PresentationMode` s'ouvre
- Navigation ◄/► + touches ←/→ + Échap
- Notes locales par section (non persistées)

### Export PDF
`src/components/PdfExport/` — layout éditeur en lignes/cellules flex.
- `captureBlocks.ts` : capture les vrais éléments depuis la page (data-export-target)
- `buildPdf.tsx` : import dynamique, dimensions PDF depuis ratios flex

---

## Branches actives

| Branche | Contenu |
|---|---|
| `main` | Base stable |
| `feat/export-pdf` | Mode présentation + export PDF layout éditeur |
