import { ReactNode } from 'react'
import { motion } from 'framer-motion'
import Sidebar from './Sidebar'
import TopNav from './TopNav'
import { useUIStore } from '@/store'

interface DashboardLayoutProps {
  children: ReactNode
  title?: string
}

export default function DashboardLayout({ children, title }: DashboardLayoutProps) {
  const { sidebarCollapsed } = useUIStore()
  const marginLeft = sidebarCollapsed ? 72 : 240

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <Sidebar />
      <TopNav title={title} />
      <motion.main
        animate={{ marginLeft }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
        className="pt-16 min-h-screen"
      >
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="p-6"
        >
          {children}
        </motion.div>
      </motion.main>
    </div>
  )
}
