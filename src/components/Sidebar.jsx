import { useState, useMemo } from 'react'
import { BRAND } from '../branding'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'

const menu = [
  { key: 'dashboard', label: 'Dashboard', icon: '📊' },
  { key: 'karyawan', label: 'Karyawan', icon: '👥' },
  { key: 'gaji', label: 'Payroll', icon: '💰' },
  { key: 'cuti', label: 'Cuti', icon: '🏖️' },
  { key: 'shift', label: 'Shift', icon: '🔄' },
  { key: 'area', label: 'Area', icon: '📍' },
  {
    key: 'laporan', label: 'Laporan', icon: '📋',
    children: [
      { key: 'laporan', label: 'Bulanan' },
      { key: 'timesheet', label: 'Timesheet' },
      { key: 'tahunan', label: 'Tahunan' },
      { key: 'employeein', label: 'Employee In' },
      { key: 'employeeout', label: 'Employee Out' },
      { key: 'kontrak', label: 'Kontrak' },
    ],
  },
]

export default function Sidebar({ active, onNavigate }) {
  const { darkMode, setDarkMode, refreshData, karyawan } = useApp()
  const { user, logout } = useAuth()
  const [open, setOpen] = useState('laporan')

  const kontrakExpired = useMemo(() => {
    const today = new Date()
    return karyawan.filter((k) => {
      if (k.Status !== 'Active') return false
      const akhir = k['Kontrak Akhir']
      if (!akhir) return false
      const tgl = new Date(akhir)
      return tgl < today
    }).length
  }, [karyawan])

  const isChildActive = (parent) => parent.children?.some((c) => c.key === active)

  return (
    <>
      <div className="lg:hidden fixed inset-0 bg-black/30 z-40" />
      <aside className="fixed lg:sticky top-0 left-0 h-full w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 z-50 flex flex-col transition-colors">
        <div className="p-5 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg overflow-hidden" style={{ backgroundColor: BRAND.primaryColor }}>
              {BRAND.logoImg ? (
                <img src={BRAND.logoImg} alt="logo" className="w-full h-full object-contain" />
              ) : (
                BRAND.logo
              )}
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-800 dark:text-white">{BRAND.name}</h1>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 leading-tight">{BRAND.tagline}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {menu.map((m) =>
            m.children ? (
              <div key={m.key}>
                <button
                  onClick={() => setOpen(open === m.key ? null : m.key)}
                  className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isChildActive(m) || active === m.key
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-semibold'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <span>{m.icon}</span>
                    {m.label}
                  </span>
                  <span className="text-xs">{open === m.key ? '▼' : '▶'}</span>
                </button>
                {open === m.key && (
                  <div className="ml-4 mt-1 space-y-1">
                    {m.children.map((c) => (
                      <button
                        key={c.key}
                        onClick={() => onNavigate(c.key)}
                        className={`w-full flex items-center justify-between px-4 py-2 rounded-lg text-sm transition-all ${
                          active === c.key
                            ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium'
                            : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                      >
                        <span>{c.label}</span>
                        {c.key === 'kontrak' && kontrakExpired > 0 && (
                          <span className="bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full">{kontrakExpired}</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <button
                key={m.key}
                onClick={() => onNavigate(m.key)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  active === m.key
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-semibold'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <span>{m.icon}</span>
                {m.label}
              </button>
            )
          )}
        </nav>

        <div className="p-3 border-t border-gray-200 dark:border-gray-700 space-y-1">
          <button onClick={() => { refreshData() }}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all">
            <span>🔄</span>
            Refresh Data
          </button>
          <div className="px-4 py-2 text-xs text-gray-400 dark:text-gray-500 border-b border-gray-200 dark:border-gray-700">
            {user?.nama || 'Perusahaan'}
          </div>
          <button onClick={() => onNavigate('branding')}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all">
            <span>🎨</span>
            Branding
          </button>
          <button onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all">
            <span>🚪</span>
            Logout
          </button>
        </div>

        <div className="px-3 pb-3">
          <button onClick={() => setDarkMode(!darkMode)}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all">
            <span>{darkMode ? '☀️' : '🌙'}</span>
            {darkMode ? 'Terang' : 'Gelap'}
          </button>
        </div>
      </aside>
    </>
  )
}
