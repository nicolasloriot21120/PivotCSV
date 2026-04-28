import { ThemeProvider } from '@/context/ThemeContext'
import { ReportPage }   from '@/pages/ReportPage/ReportPage'

export default function App() {
  return (
    <ThemeProvider>
      <ReportPage />
    </ThemeProvider>
  )
}
