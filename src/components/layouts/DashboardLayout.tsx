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
  const sidebarWidth = sidebarCollapsed ? '72px' : '240px'

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <Sidebar />
      <TopNav title={title} />

      {/*
        .dashboard-main sets margin-left via CSS var on desktop.
        On mobile (<768px) globals.css forces margin-left: 0 so the
        sidebar overlay doesn't push content off-screen.
      */}
      <main
        className="dashboard-main pt-16 min-h-screen"
        style={{ '--sidebar-width': sidebarWidth } as React.CSSProperties}
      >
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="p-4 md:p-6"
        >
          {children}
        </motion.div>
      </main>
    </div>
  )
}