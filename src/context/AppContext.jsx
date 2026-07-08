import { createContext, useContext, useState, useEffect } from 'react'
import { fetchAbsensi } from '../services/sheetsApi'

const AppContext = createContext()

export function AppProvider({ children }) {
  const [absensi, setAbsensi] = useState([])
  const [karyawan, setKaryawan] = useState([])
  const [gaji, setGaji] = useState([])
  const [shiftMap, setShiftMap] = useState({})
  const [daftarArea, setDaftarArea] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true')
  const [toast, setToast] = useState(null)

  useEffect(() => {
    fetchAbsensi()
      .then((res) => {
        setAbsensi(res.absensi)
        setKaryawan(res.karyawan)
        setGaji(res.gaji)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
    localStorage.setItem('darkMode', darkMode)
  }, [darkMode])

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const refreshData = () => {
    setLoading(true)
    fetchAbsensi()
      .then((res) => {
        setAbsensi(res.absensi)
        setKaryawan(res.karyawan)
        setGaji(res.gaji)
        setShiftMap(res.shiftMap || {})
        setDaftarArea(res.daftarArea || [])
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }

  const updateGaji = (nama, gajiPokok, gajiHarian) => {
    setGaji((prev) => {
      const filtered = prev.filter((g) => (g['Nama'] || '') !== nama.toLowerCase())
      return [...filtered, { 'Nama': nama.toLowerCase(), 'Gaji Pokok': String(gajiPokok), 'Gaji Harian': String(gajiHarian || 0) }]
    })
  }

  return (
    <AppContext.Provider value={{ absensi, karyawan, gaji, shiftMap, daftarArea, loading, error, darkMode, setDarkMode, toast, showToast, updateGaji, refreshData }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)
