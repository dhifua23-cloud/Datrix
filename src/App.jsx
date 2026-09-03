import { useState } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { AppProvider } from './context/AppContext'
import Layout from './components/Layout'
import Toast from './components/Toast'
import BrandingModal from './components/BrandingModal'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import KaryawanPage from './pages/KaryawanPage'
import GajiPage from './pages/GajiPage'
import CutiPage from './pages/CutiPage'
import ShiftPage from './pages/ShiftPage'
import DaftarAreaPage from './pages/DaftarAreaPage'
import TimesheetPage from './pages/TimesheetPage'
import RekapTahunanPage from './pages/RekapTahunanPage'
import LaporanPage from './pages/LaporanPage'
import EmployeeMovementPage from './pages/EmployeeMovementPage'
import ContractPage from './pages/ContractPage'
import RekapPage from './pages/RekapPage'

function AppDashboard() {
  const { user } = useAuth()
  const [page, setPage] = useState('dashboard')
  const [showBranding, setShowBranding] = useState(false)

  if (!user) return null

  const handleNavigate = (p) => {
    if (p === 'branding') { setShowBranding(true); return }
    setPage(p)
  }

  const pages = {
    dashboard: <DashboardPage />,
    karyawan: <KaryawanPage />,
    gaji: <GajiPage />,
    cuti: <CutiPage />,
    shift: <ShiftPage />,
    area: <DaftarAreaPage />,
    timesheet: <TimesheetPage />,
    tahunan: <RekapTahunanPage />,
    laporan: <LaporanPage />,
    employeein: <EmployeeMovementPage type="in" />,
    employeeout: <EmployeeMovementPage type="out" />,
    kontrak: <ContractPage />,
    rekap: <RekapPage />,
  }

  return (
    <AppProvider>
      <Layout page={page} onNavigate={handleNavigate}>
        {pages[page]}
        <Toast />
        {showBranding && <BrandingModal onClose={() => setShowBranding(false)} />}
      </Layout>
    </AppProvider>
  )
}

function AppContent() {
  const { user } = useAuth()
  if (!user) return <LoginPage />
  return <AppDashboard />
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App
