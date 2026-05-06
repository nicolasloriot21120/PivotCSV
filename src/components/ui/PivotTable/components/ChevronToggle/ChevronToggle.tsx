import { ChevronDown, ChevronRight } from 'lucide-react'
import styles from './ChevronToggle.module.css'

export type ChevronToggleProps = {
  collapsed: boolean
}

export function ChevronToggle({ collapsed }: ChevronToggleProps) {
  const Icon = collapsed ? ChevronRight : ChevronDown
  return <Icon size={11} className={styles.chevron} />
}
