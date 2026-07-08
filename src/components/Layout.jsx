import { useState } from 'react'
import Sidebar from './Sidebar'
import { BRAND } from '../branding'

export default function Layout({ page, onNavigate, children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-950 transition-colors">
      <Sidebar active={page} onNavigate={onNavigate} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Floating logo trigger */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="fixed top-3 left-3 z-30 w-10 h-10 rounded-xl shadow-lg flex items-center justify-center text-white font-bold text-lg overflow-hidden hover:opacity-90 transition-all"
        style={{ backgroundColor: BRAND.primaryColor }}
        title="Buka menu"
      >
        {BRAND.logoImg ? <img src={BRAND.logoImg} alt="" className="w-full h-full object-contain" /> : BRAND.logo}
      </button>

      <main className="flex-1 p-4 md:p-8 overflow-auto min-h-screen pl-16">
        <div className="animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  )
}
