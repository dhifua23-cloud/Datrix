import { useState } from 'react'
import Sidebar from './Sidebar'

export default function Layout({ page, onNavigate, children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-950 transition-colors">
      <Sidebar active={page} onNavigate={onNavigate} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="flex-1 p-4 md:p-8 overflow-auto min-h-screen">
        {/* Mobile hamburger */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="fixed top-3 left-3 z-30 lg:hidden w-9 h-9 bg-white dark:bg-gray-800 rounded-lg shadow flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div className="lg:pt-0 pt-12 animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  )
}
