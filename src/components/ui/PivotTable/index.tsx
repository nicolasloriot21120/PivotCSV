import { ChevronDown, ChevronRight } from 'lucide-react'
import type { PivotData, AggregationType } from '@/lib/pivot/types'

// =============================================================================
// CLÉS
// =============================================================================
//
// Les données du pivot (PivotData) sont indexées par des chaînes-clés.
// On utilise exactement les mêmes helpers que PivotAccumulator (worker) pour
// garantir la cohérence entre ce qui est stocké et ce qu'on lit ici.
//
//   keyStr(['Paris', 'A'])  →  'Paris\x00A'
//       Séparer par \x00 (null byte) évite toute collision si une valeur
//       contient elle-même un séparateur courant (virgule, espace...).
//
//   cellKey(rowKey, colKey) →  '["Paris\x00A","Cat1"]'
//       JSON.stringify d'un tableau [rk, ck] ; produit une clé unique
//       pour chaque intersection (ligne × colonne) dans cells{}.

const keyStr  = (parts: string[]) => parts.join('\x00')
const cellKey = (rk: string, ck: string) => JSON.stringify([rk, ck])

// Symboles affichés sur les boutons d'agrégation (identiques au configurateur)
const AGG_SYM: Record<AggregationType, string> = {
  sum: 'Σ', count: '#', avg: 'Ø', min: '▼', max: '▲',
}

// Formate un nombre pour l'affichage FR (séparateur milliers, 2 décimales max)
// count n'a pas de décimales car c'est toujours un entier
function fmt(v: number | null, agg: AggregationType): string {
  if (v === null) return '—'
  return agg === 'count'
    ? v.toLocaleString('fr-FR')
    : v.toLocaleString('fr-FR', { maximumFractionDigits: 2 })
}

// =============================================================================
// AGRÉGATION SUR UN GROUPE COLLAPSÉ
// =============================================================================
//
// Quand un groupe est collapsé, ses cellules affichent l'agrégat de toutes
// ses feuilles. On ne peut pas lire les totaux pré-calculés (rowTotals /
// colTotals) car ils concernent une seule dimension ; on doit réagréger
// les valeurs brutes issues de cells{}.
//
// Attention : avg est calculé comme la moyenne des moyennes (approximation).
// Pour un avg exact il faudrait avoir accès aux comptages par feuille.

function aggVals(vals: (number | null)[], type: AggregationType): number | null {
  const nums = vals.filter((v): v is number => v !== null)
  if (!nums.length) return null
  switch (type) {
    case 'sum':   return nums.reduce((a, b) => a + b, 0)
    case 'count': return nums.reduce((a, b) => a + b, 0)  // count est additif
    case 'avg':   return nums.reduce((a, b) => a + b, 0) / nums.length
    case 'min':   return Math.min(...nums)
    case 'max':   return Math.max(...nums)
  }
}

// =============================================================================
// ARBRE DE GROUPAGE (TreeNode)
// =============================================================================
//
// Le pivot peut avoir plusieurs champs en ligne (et en colonne).
// Exemple : lignes = ['Région', 'Ville', 'Produit']
//
// PivotData.rowKeys contient toutes les combinaisons uniques :
//   [['Nord', 'Lille', 'A'], ['Nord', 'Lille', 'B'], ['Nord', 'Paris', 'A'], ...]
//
// On construit un arbre hiérarchique :
//   GroupNode 'Nord' (depth 0)
//     GroupNode 'Lille' (depth 1)
//       LeafNode ['Nord', 'Lille', 'A']
//       LeafNode ['Nord', 'Lille', 'B']
//     GroupNode 'Paris' (depth 1)
//       LeafNode ['Nord', 'Paris', 'A']
//   GroupNode 'Sud' (depth 0)
//     ...
//
// Avec 1 seul champ : buildTree retourne directement des LeafNodes (pas de
// groupage possible, pas de bouton collapse/expand).
//
// CONVENTION D'AFFICHAGE :
//   - Un GroupNode est TOUJOURS visible (c'est la ligne de sous-total).
//   - Ses enfants sont visibles seulement si collapsed === false.
//   - Collapsed → la ligne du groupe montre l'agrégat de toutes ses feuilles.
//   - Expanded  → la ligne du groupe est un en-tête ; les enfants s'affichent
//                 en-dessous avec indentation croissante.

type GroupNode = {
  type:        'group'
  prefixKey:   string     // keyStr du chemin partiel (ex: 'Nord\x00Lille')
                          // → sert d'identifiant stable pour le toggle
  label:       string     // valeur à ce niveau (ex: 'Lille')
  depth:       number     // profondeur dans l'arbre (0 = niveau racine)
  allLeafKeys: string[][] // toutes les clés-feuilles sous ce groupe
                          // → utilisées pour l'agrégation des cellules
  collapsed:   boolean    // état collapse/expand courant
  children:    TreeNode[] // sous-arbre (GroupNodes ou LeafNodes)
}

type LeafNode = {
  type: 'leaf'
  key:  string[]  // clé complète ex: ['Nord', 'Lille', 'A']
}

type TreeNode = GroupNode | LeafNode

// Construit l'arbre récursivement depuis une liste de clés plates.
// depth : niveau courant de groupage (commence à 0).
// collapsed : Set des prefixKey actuellement repliés (vient de Section.collapsedRowGroups).
function buildTree(keys: string[][], depth: number, collapsed: Set<string>): TreeNode[] {
  if (!keys.length) return []
  const nF = keys[0].length  // nombre de champs (ex: 3 pour ['Région','Ville','Produit'])

  // Au dernier niveau (depth = nF - 1) on crée des feuilles, pas des groupes.
  // Ex: nF=2, depth=1 → feuilles. nF=1, depth=0 → feuilles (pas de groupage).
  if (depth >= nF - 1) return keys.map(k => ({ type: 'leaf' as const, key: k }))

  // Regrouper les clés par leur valeur à ce niveau (en conservant l'ordre d'apparition)
  const groups = new Map<string, string[][]>()
  for (const k of keys) {
    const g = k[depth]
    if (!groups.has(g)) groups.set(g, [])
    groups.get(g)!.push(k)
  }

  return [...groups.entries()].map(([label, gk]) => {
    // prefixKey = partie commune de toutes les clés du groupe (ex: 'Nord\x00Lille')
    const pk = keyStr(gk[0].slice(0, depth + 1))
    return {
      type:        'group' as const,
      prefixKey:   pk,
      label,
      depth,
      allLeafKeys: gk,
      collapsed:   collapsed.has(pk),  // l'état est persisté dans Section.collapsedRowGroups
      children:    buildTree(gk, depth + 1, collapsed),
    }
  })
}

// Nombre de "slots" visuels occupés par un nœud dans le tableau.
// - Feuille → 1 slot.
// - Groupe collapsé → 1 slot (il se réduit à sa propre ligne de sous-total).
// - Groupe expansé → 1 (son propre slot sous-total) + somme récursive des enfants.
//   Le +1 est crucial : visSlots inclut TOUJOURS le GroupNode lui-même (sous-total),
//   donc le header doit réserver une colonne pour lui même quand il est ouvert.
// Utilisé pour calculer les colSpan dans les en-têtes de colonnes.
function countVis(node: TreeNode): number {
  if (node.type === 'leaf') return 1
  if (node.collapsed) return 1
  return 1 + node.children.reduce((s, c) => s + countVis(c), 0)
}

// Retourne la liste à plat de tous les nœuds VISIBLES (ordre d'affichage).
// Chaque nœud dans ce tableau correspond à une ligne (ou colonne) du tableau.
// Un groupe expansé génère : [groupe, ...enfants_visibles_récursifs].
// Un groupe collapsé génère : [groupe] seulement (les enfants sont masqués).
function visSlots(nodes: TreeNode[]): TreeNode[] {
  const r: TreeNode[] = []
  for (const n of nodes) {
    r.push(n)  // le nœud lui-même est toujours visible
    if (n.type === 'group' && !n.collapsed) r.push(...visSlots(n.children))
  }
  return r
}

// Retourne les clés-feuilles d'un nœud (pour l'agrégation des cellules).
// - Feuille → sa propre clé dans un tableau à un élément.
// - Groupe → allLeafKeys (toutes ses descendantes, pré-calculé dans buildTree).
function leafKeys(node: TreeNode): string[][] {
  return node.type === 'leaf' ? [node.key] : node.allLeafKeys
}

// Collecte récursivement les prefixKey de TOUS les GroupNodes d'un arbre.
// Utilisé pour "Tout replier" : on passe ce tableau à onSetCollapsedRows/Cols.
function allGroupKeys(nodes: TreeNode[]): string[] {
  const keys: string[] = []
  for (const n of nodes) {
    if (n.type === 'group') {
      keys.push(n.prefixKey)
      keys.push(...allGroupKeys(n.children))
    }
  }
  return keys
}

// =============================================================================
// EN-TÊTES DE COLONNES MULTI-NIVEAUX
// =============================================================================
//
// Avec plusieurs champs en colonne (ex: ['Catégorie', 'Sous-catégorie']),
// le <thead> doit afficher autant de lignes que de niveaux.
//
// Exemple (nCF=2, nVal=1) avec Cat A expansée, Cat B collapsée :
//
//   ┌──────────────────────┬────────────────┐
//   │ Cat A (colSpan=2)    │ Cat B (colSpan=1, rowSpan=2) │
//   ├────────────┬─────────┤                │
//   │ Sub1       │ Sub2    │   <occupé par  │
//   │ (rowSpan   │         │    Cat B)      │
//   │ hérite)    │         │                │
//   └────────────┴─────────┴────────────────┘
//
// Pour Cat B collapsée : rowSpan = nCF - depth = 2 - 0 = 2
//   → elle occupe toute la hauteur de l'en-tête, pas de sous-ligne.
// Pour Sub1/Sub2 (feuilles) : rowSpan = nCF - depth = 2 - 1 = 1.
//
// nVal > 1 : chaque slot de colonne occupe nVal colonnes de données.
//   Le colSpan est donc multiplié par nVal.

type HCell = {
  label:     string
  colSpan:   number       // nombre de colonnes de données couvertes
  rowSpan:   number       // nombre de lignes d'en-tête couvertes
  prefixKey: string | null // non-null → cellule cliquable (groupe), null → feuille
  collapsed: boolean
}

// Construit un tableau de lignes d'en-tête (une par niveau de champ colonne).
// Chaque ligne est un tableau de HCell avec colSpan/rowSpan calculés.
function buildColHeader(colTree: TreeNode[], nCF: number, nVal: number): HCell[][] {
  if (!nCF) return []  // pas de champs colonne → aucun en-tête à construire

  // Une ligne par niveau (depth 0 à nCF-1)
  const rows: HCell[][] = Array.from({ length: nCF }, () => [])

  function visit(nodes: TreeNode[], d: number) {
    for (const n of nodes) {
      const lc = countVis(n)  // nombre de slots visuels = nombre de colonnes de données / nVal
      if (n.type === 'leaf') {
        // Feuille : affiche le dernier segment de la clé (ex: 'Sub1' sur la ligne 1)
        // rowSpan = nCF - d pour descendre jusqu'au bas de l'en-tête si elle
        // se retrouve à un niveau plus haut que le fond (ne peut pas être cliquée).
        rows[d].push({
          label:     n.key[n.key.length - 1],
          colSpan:   nVal,         // 1 slot = nVal colonnes de données
          rowSpan:   nCF - d,      // remonte les niveaux vides en dessous
          prefixKey: null,
          collapsed: false,
        })
      } else {
        // Groupe : colSpan = nbSlots * nVal ; rowSpan = 1 si expansé, tout le reste si collapsé
        rows[d].push({
          label:     n.label,
          colSpan:   lc * nVal,
          rowSpan:   n.collapsed ? nCF - d : 1,  // collapsé → absorbe les sous-lignes
          prefixKey: n.prefixKey,
          collapsed: n.collapsed,
        })
        if (!n.collapsed) {
          // Le groupe reste visible en tant que colonne sous-total (slot propre).
          // On ajoute une cellule "Σ" à la ligne d+1 pour représenter ce slot,
          // puis on descend récursivement pour les enfants.
          // rowSpan = nCF - (d+1) : la cellule "descend" jusqu'au bas de l'en-tête
          // (même logique que les feuilles dont rowSpan = nCF - depth).
          rows[d + 1].push({
            label:     'Σ',
            colSpan:   nVal,
            rowSpan:   nCF - (d + 1),
            prefixKey: null,
            collapsed: false,
          })
          visit(n.children, d + 1)
        }
      }
    }
  }

  visit(colTree, 0)
  return rows
}

// =============================================================================
// PROPS DU COMPOSANT
// =============================================================================

export type PivotTableProps = {
  data:               PivotData
  showRowTotals:      boolean
  showColTotals:      boolean
  collapsedRowGroups: string[]
  collapsedColGroups: string[]
  onToggleRowGroup:   (pk: string) => void
  onToggleColGroup:   (pk: string) => void
  onSetCollapsedRows: (pks: string[]) => void
  onSetCollapsedCols: (pks: string[]) => void
  formatValue?:       (v: number) => string   // formateur personnalisé (échelle + décimales)
}

// =============================================================================
// COMPOSANT
// =============================================================================

export function PivotTable({
  data, showRowTotals, showColTotals,
  collapsedRowGroups, collapsedColGroups,
  onToggleRowGroup, onToggleColGroup,
  onSetCollapsedRows, onSetCollapsedCols,
  formatValue,
}: PivotTableProps) {
  const { config, rowKeys, colKeys, cells, rowTotals, colTotals, grandTotal } = data
  const { values } = config

  const fmtCell = (v: number | null, agg: AggregationType) => {
    if (v === null) return '—'
    if (formatValue && agg !== 'count') return formatValue(v)
    return fmt(v, agg)
  }

  const nVal     = values.length           // nombre de champs valeur (ex: 2 si Σ Qté + Σ CA)
  const nRF      = config.rows.length      // nombre de champs ligne
  const nCF      = config.columns.length   // nombre de champs colonne
  const multiVal = nVal > 1                // → ligne de labels valeurs dans l'en-tête
  const hasCols  = nCF > 0                // → false si aucun champ colonne configuré

  // Convertir les tableaux en Set pour les lookups O(1) dans buildTree
  const collapsedR = new Set(collapsedRowGroups)
  const collapsedC = new Set(collapsedColGroups)

  // Arbres hiérarchiques pour lignes et colonnes
  const rowTree = buildTree(rowKeys, 0, collapsedR)
  const colTree = hasCols ? buildTree(colKeys, 0, collapsedC) : []

  // Listes à plat des nœuds visibles = une entrée par ligne/colonne affichée
  const rowSlots = visSlots(rowTree)
  const colSlots = hasCols ? visSlots(colTree) : []

  // Lignes d'en-tête de colonnes (une par niveau de champ colonne)
  const colHdrs = buildColHeader(colTree, nCF, nVal)

  // Nombre total de lignes dans le <thead> :
  //   - hasCols  → nCF lignes pour les groupes de colonnes
  //   - !hasCols → 1 ligne (juste le coin + "Total")
  //   - +1 si plusieurs valeurs (ligne de labels Σ/#/Ø/▼/▲)
  const colHeaderRows = hasCols ? nCF : 1
  const nHeaderRows   = colHeaderRows + (multiVal ? 1 : 0)

  // ── Getters de valeurs ────────────────────────────────────────────────────
  //
  // Ces trois fonctions gèrent les cas "feuille" ET "groupe collapsé".
  // Pour une feuille, on lit directement dans cells / rowTotals / colTotals.
  // Pour un groupe, on collecte les valeurs de toutes ses feuilles et on
  // ré-agrège (somme, min, max, etc.).

  // Valeur à l'intersection (rs = slot ligne, cs = slot colonne)
  const getCellVals = (rs: TreeNode, cs: TreeNode): (number | null)[] => {
    const rL = leafKeys(rs)  // feuilles de la ligne (1 si feuille, N si groupe)
    const cL = leafKeys(cs)  // feuilles de la colonne (idem)
    return values.map((vc, vi) => {
      // Produit cartésien : toutes les intersections (rp × cp)
      const vals = rL.flatMap(rp => cL.map(cp =>
        cells[cellKey(keyStr(rp), keyStr(cp))]?.[vi] ?? null
      ))
      return aggVals(vals, vc.aggregation)
    })
  }

  // Total de la ligne rs (colonne "Total" à droite)
  // On utilise rowTotals pré-calculés (plus précis pour avg que re-agréger les cells)
  const getRowTotalVals = (rs: TreeNode): (number | null)[] => {
    const rL = leafKeys(rs)
    return values.map((vc, vi) =>
      aggVals(rL.map(rp => rowTotals[keyStr(rp)]?.[vi] ?? null), vc.aggregation)
    )
  }

  // Total de la colonne cs (ligne "Total" en bas)
  const getColTotalVals = (cs: TreeNode): (number | null)[] => {
    const cL = leafKeys(cs)
    return values.map((vc, vi) =>
      aggVals(cL.map(cp => colTotals[keyStr(cp)]?.[vi] ?? null), vc.aggregation)
    )
  }

  if (!rowSlots.length) {
    return <p className="text-xs text-subtle italic">Aucune donnée à afficher.</p>
  }

  // Classes CSS partagées pour éviter la répétition
  const thBase = 'border border-border bg-elevated px-3 py-2 font-medium whitespace-nowrap'
  const tdBase = 'border border-border px-3 py-1.5 whitespace-nowrap'

  // Des groupes existent-ils ? (nRF > 1 → groupes lignes, nCF > 1 → groupes colonnes)
  const hasRowGroups = nRF > 1
  const hasColGroups = nCF > 1

  // true = au moins un groupe est replié → le bouton proposera "Ouvrir"
  const rowHasClosed = collapsedRowGroups.length > 0
  const colHasClosed = collapsedColGroups.length > 0

  // ============================================================================
  // RENDU
  // ============================================================================

  return (
    <div className="flex flex-col gap-2">

      {/* ── Toolbar toggle par axe ────────────────────────────────────────
          Un seul bouton par axe, identique aux toggles "Totaux" de PivotSection.
          État actif (groupes repliés) : accent — label "Ouvrir"
          État inactif (tout déplié)   : neutre  — label "Fermer"            */}
      {(hasRowGroups || hasColGroups) && (
        <div className="flex items-center gap-2 flex-wrap">
          {hasRowGroups && (
            <button
              onClick={() => rowHasClosed ? onSetCollapsedRows([]) : onSetCollapsedRows(allGroupKeys(rowTree))}
              className={[
                'flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--radius-sm)]',
                'text-[11px] font-medium border transition-all duration-150',
                rowHasClosed
                  ? 'bg-accent/10 border-accent/40 text-accent-hi'
                  : 'bg-elevated border-border text-subtle hover:text-text',
              ].join(' ')}
            >
              <span className={['w-1.5 h-1.5 rounded-full flex-shrink-0', rowHasClosed ? 'bg-accent' : 'bg-border-strong'].join(' ')} />
              Lignes — {rowHasClosed ? 'Ouvrir' : 'Fermer'}
            </button>
          )}
          {hasColGroups && (
            <button
              onClick={() => colHasClosed ? onSetCollapsedCols([]) : onSetCollapsedCols(allGroupKeys(colTree))}
              className={[
                'flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--radius-sm)]',
                'text-[11px] font-medium border transition-all duration-150',
                colHasClosed
                  ? 'bg-accent/10 border-accent/40 text-accent-hi'
                  : 'bg-elevated border-border text-subtle hover:text-text',
              ].join(' ')}
            >
              <span className={['w-1.5 h-1.5 rounded-full flex-shrink-0', colHasClosed ? 'bg-accent' : 'bg-border-strong'].join(' ')} />
              Colonnes — {colHasClosed ? 'Ouvrir' : 'Fermer'}
            </button>
          )}
        </div>
      )}

    <div className="overflow-auto rounded-[var(--radius-md)] border border-border">
      <table className="border-collapse text-xs w-full">

        {/* ══════════════════════════════════════════════════════════════════
            EN-TÊTES (thead)

            Structure avec hasCols=true, nCF=2, nVal=2, showRowTotals=true :

            ┌──────────┬──────────────────────┬───────────────┬────────────┐
            │ Région › │   Cat A  (colSpan=4) │ Cat B(cS=2,   │ Total(cS=2 │
            │ Ville    │                      │  rS=2)        │  rS=2)     │
            │ (rS=4)   ├──────────┬───────────┤               │            │
            │          │ Sub1(cS=2│ Sub2(cS=2)│               │            │
            │          ├────┬─────┼────┬──────┤               │            │
            │          │ΣQté│ΣCA  │ΣQté│ΣCA   │               │            │
            └──────────┴────┴─────┴────┴──────┴───────────────┴────────────┘

            Le coin supérieur gauche (rowSpan=4) contient les champs ligne.
            "Total" (rowSpan=2) couvre les 2 lignes de groupes de colonnes.
            La ligne de labels valeurs (Σ Qté, Σ CA) est toujours la dernière.
        ══════════════════════════════════════════════════════════════════ */}
        <thead>

          {/* CAS NORMAL : au moins un champ colonne → une ligne par niveau */}
          {hasCols && colHdrs.map((row, di) => (
            <tr key={di}>

              {/* Coin supérieur gauche — rendu une seule fois (di===0) car rowSpan */}
              {di === 0 && (
                <th
                  rowSpan={nHeaderRows}
                  className={`${thBase} text-left text-subtle`}
                >
                  {config.rows.map(f => f.field).join(' › ')}
                </th>
              )}

              {/* Cellules de groupes/feuilles pour ce niveau de colonne */}
              {row.map((cell, ci) => (
                <th
                  key={ci}
                  colSpan={cell.colSpan}
                  rowSpan={cell.rowSpan}
                  // prefixKey !== null → c'est un groupe cliquable
                  onClick={cell.prefixKey ? () => onToggleColGroup(cell.prefixKey!) : undefined}
                  className={[
                    thBase, 'text-center',
                    cell.prefixKey
                      ? 'cursor-pointer select-none hover:bg-elevated/80 text-text'
                      : 'text-text font-semibold',
                  ].join(' ')}
                >
                  <span className="flex items-center justify-center gap-1">
                    {/* Chevron uniquement sur les groupes (feuilles = prefixKey null) */}
                    {cell.prefixKey && (
                      cell.collapsed
                        ? <ChevronRight size={11} className="text-accent flex-shrink-0" />
                        : <ChevronDown  size={11} className="text-accent flex-shrink-0" />
                    )}
                    {cell.label}
                  </span>
                </th>
              ))}

              {/* En-tête "Total" — rendu une seule fois (di===0), rowSpan=colHeaderRows
                  pour couvrir toutes les lignes de groupes mais PAS la ligne de labels */}
              {di === 0 && showRowTotals && (
                <th
                  rowSpan={colHeaderRows}
                  colSpan={nVal}
                  className={`${thBase} text-center text-accent-hi font-semibold`}
                >
                  Total
                </th>
              )}
            </tr>
          ))}

          {/* CAS SANS CHAMP COLONNE : une seule ligne structurelle
              (les données seront dans la colonne "Total") */}
          {!hasCols && (
            <tr>
              <th rowSpan={nHeaderRows} className={`${thBase} text-left text-subtle`}>
                {config.rows.map(f => f.field).join(' › ')}
              </th>
              {showRowTotals && (
                <th
                  rowSpan={colHeaderRows}
                  colSpan={nVal}
                  className={`${thBase} text-center text-accent-hi font-semibold`}
                >
                  Total
                </th>
              )}
            </tr>
          )}

          {/* LIGNE DE LABELS VALEURS (seulement si nVal > 1)
              Une cellule par (slot colonne × valeur) + idem pour la colonne Total.
              Exemple : [Σ Quantité | Σ CA | Σ Quantité | Σ CA | Σ Quantité | Σ CA]
                         ← Cat A Sub1 →   ← Cat A Sub2 →   ←   Total  →          */}
          {multiVal && (
            <tr>
              {hasCols && colSlots.flatMap((_, ci) =>
                values.map((vc, vi) => (
                  <th
                    key={`${ci}-${vi}`}
                    className={`${thBase} text-center text-subtle font-medium text-[10px]`}
                  >
                    {AGG_SYM[vc.aggregation]} {vc.label ?? vc.field}
                  </th>
                ))
              )}
              {/* Labels pour la colonne Total (si activée) */}
              {showRowTotals && values.map((vc, vi) => (
                <th
                  key={`rt-${vi}`}
                  className={`${thBase} text-center text-subtle font-medium text-[10px]`}
                >
                  {AGG_SYM[vc.aggregation]} {vc.label ?? vc.field}
                </th>
              ))}
            </tr>
          )}

        </thead>

        {/* ══════════════════════════════════════════════════════════════════
            CORPS DU TABLEAU (tbody)

            rowSlots est la liste à plat des nœuds visibles (cf. visSlots).
            Deux types de lignes :

            1) GroupNode  → ligne de sous-total avec bouton collapse/expand
               - Fond légèrement coloré pour distinguer du contenu
               - Indentation proportionnelle à la profondeur (depth * 14px)
               - Valeurs = agrégat de toutes les feuilles sous ce groupe

            2) LeafNode   → ligne de données normale
               - Indentation = (nombre de champs ligne - 1) * 14px
                 (les feuilles sont toujours au dernier niveau)
               - Valeurs lues directement dans cells{}
        ══════════════════════════════════════════════════════════════════ */}
        <tbody>
          {rowSlots.map((rs, ri) => {
            const isGroup = rs.type === 'group'
            // Profondeur visuelle : group → rs.depth, feuille → dernier niveau (nRF - 1)
            const depth = isGroup ? rs.depth : rs.key.length - 1
            // Label affiché : group → valeur à ce niveau, feuille → dernier segment de la clé
            const label = isGroup ? rs.label : rs.key[rs.key.length - 1]

            return (
              <tr
                key={isGroup ? rs.prefixKey : keyStr(rs.key)}
                // Groupes : fond légèrement coloré + les valeurs numériques seront en text-text
                // Feuilles : alternance pair/impair subtile
                className={isGroup ? 'bg-elevated/60' : ri % 2 === 0 ? '' : 'bg-elevated/20'}
              >

                {/* Cellule de label ligne
                    Groupe : bordure gauche accent (repère visuel "cette ligne est cliquable")
                             + indentation selon la profondeur de groupage
                    Feuille : indentation = dernier niveau (nRF - 1) × 14px               */}
                <td
                  className={[
                    tdBase,
                    'text-text',
                    isGroup
                      ? 'font-semibold !border-l-2 !border-l-accent/50'
                      : 'font-medium text-muted/90',
                  ].join(' ')}
                  style={{ paddingLeft: `${12 + depth * 14}px` }}
                >
                  {isGroup ? (
                    // Groupe → bouton cliquable avec chevron accent
                    <button
                      onClick={() => onToggleRowGroup(rs.prefixKey)}
                      className="flex items-center gap-1 w-full text-left"
                    >
                      {rs.collapsed
                        ? <ChevronRight size={11} className="text-accent flex-shrink-0" />
                        : <ChevronDown  size={11} className="text-accent flex-shrink-0" />
                      }
                      {label}
                    </button>
                  ) : label /* Feuille → texte simple */}
                </td>

                {/* Cellules de données : une par (slot colonne × valeur).
                    getCellVals gère automatiquement les slots groupe (agrégation)
                    et les slots feuille (lecture directe dans cells{}). */}
                {hasCols && colSlots.flatMap((cs, ci) => {
                  const vals = getCellVals(rs, cs)
                  return values.map((vc, vi) => (
                    <td
                      key={`${ci}-${vi}`}
                      // Groupes : text-text (sous-total visible), feuilles : text-muted
                      className={`${tdBase} text-right tabular-nums ${isGroup ? 'text-text font-medium' : 'text-muted'}`}
                    >
                      {fmtCell(vals[vi], vc.aggregation)}
                    </td>
                  ))
                })}

                {/* Colonne Total (à droite) — agrégat de toutes les colonnes pour cette ligne.
                    Pour un groupe, l'agrégation est faite sur toutes ses feuilles. */}
                {showRowTotals && getRowTotalVals(rs).map((v, vi) => (
                  <td
                    key={`rt-${vi}`}
                    className={`${tdBase} text-right tabular-nums bg-elevated/30 ${isGroup ? 'font-bold text-text' : 'font-semibold text-text'}`}
                  >
                    {fmtCell(v, values[vi].aggregation)}
                  </td>
                ))}

              </tr>
            )
          })}
        </tbody>

        {/* ══════════════════════════════════════════════════════════════════
            PIED DU TABLEAU (tfoot) — ligne "Total" en bas

            Une cellule par slot colonne visible : si un groupe est collapsé,
            son total est celui de toutes ses feuilles (getColTotalVals).
            Grand total = data.grandTotal (calculé par le worker, exact).
        ══════════════════════════════════════════════════════════════════ */}
        {showColTotals && (
          <tfoot>
            <tr>
              <td className={`${tdBase} font-semibold text-accent-hi bg-elevated/30`}>
                Total
              </td>

              {hasCols && colSlots.flatMap((cs, ci) => {
                const vals = getColTotalVals(cs)
                return values.map((vc, vi) => (
                  <td
                    key={`ct-${ci}-${vi}`}
                    className={`${tdBase} text-right tabular-nums font-semibold text-text bg-elevated/30`}
                  >
                    {fmtCell(vals[vi], vc.aggregation)}
                  </td>
                ))
              })}

              {/* Grand total (intersection Total lignes × Total colonnes) */}
              {showRowTotals && values.map((vc, vi) => (
                <td
                  key={`gt-${vi}`}
                  className={`${tdBase} text-right tabular-nums font-bold text-accent-hi bg-accent/10`}
                >
                  {fmtCell(grandTotal[vi] ?? null, vc.aggregation)}
                </td>
              ))}
            </tr>
          </tfoot>
        )}

      </table>
    </div>
    </div>  /* fin du conteneur flex (toolbar + table) */
  )
}
