# PivotCSV — CLAUDE.md

## Stack

- React 19 + Vite 8 + TypeScript
- Tailwind v4 (pas de `tailwind.config.js`)
- @dnd-kit/core + @dnd-kit/sortable — drag-and-drop sections
- Recharts — graphiques (BarChart, LineChart, PieChart)
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

---

## Workflow GitHub

### Issues
Chaque feature commence par une issue GitHub avec une user story et une checklist de critères d'acceptance :

```markdown
## User story
En tant que [rôle], je veux [action] afin de [bénéfice].

## Critères d'acceptance
- [ ] Critère 1
- [ ] Critère 2
- [ ] Critère 3
```

### Branches
Une branche par feature : `feat/<nom>`, `fix/<nom>`, `refacto/<nom>`.

### Pull Requests
Format de PR avec cases à cocher dans le plan de test :

```markdown
## Summary
- Point clé 1
- Point clé 2
- Point clé 3

## Test plan
- [ ] Cas nominal
- [ ] Cas limite 1
- [ ] Cas limite 2
- [ ] Pas de régression sur [feature liée]

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

**Règles :**
- Ne pas merger sans validation explicite de Nicolas
- Ne pas fermer les issues après merge — Nicolas le fait manuellement
- Pas de `Co-Authored-By` dans les commits

---

## Branches actives

| Branche | Contenu |
|---|---|
| `main` | Base stable |
