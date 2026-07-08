import Sidebar from './Sidebar'

export default function Layout({ page, onNavigate, children }) {
  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-950 transition-colors">
      <Sidebar active={page} onNavigate={onNavigate} />
      <main className="flex-1 p-4 md:p-8 overflow-auto animate-fade-in">
        {children}
      </main>
    </div>
  )
}
