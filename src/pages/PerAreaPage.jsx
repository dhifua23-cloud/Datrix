import { useMemo } from 'react'
import { useApp } from '../context/AppContext'
import { SkeletonCard } from '../components/Skeleton'

export default function PerAreaPage() {
  const { absensi, karyawan, loading } = useApp()
  const today = new Date().toISOString().slice(0, 10)

  const perArea = useMemo(() => {
    const todayAbsen = absensi.filter((d) => d.Tanggal?.startsWith(today))
    const map = {}

    karyawan.forEach((k) => {
      const area = k.Area || 'Lainnya'
      if (!map[area]) map[area] = { area, total: 0, hadir: 0, telat: 0, izin: 0, sakit: 0, alpha: 0 }
      map[area].total++
    })

    todayAbsen.forEach((d) => {
      const area = d.Area || 'Lainnya'
      if (!map[area]) return
      const s = d['Status Kehadiran']
      if (s === 'Hadir') map[area].hadir++
      else if (s === 'Telat') map[area].telat++
      else if (s === 'Izin') map[area].izin++
      else if (s === 'Sakit') map[area].sakit++
      else map[area].alpha++
    })

    return Object.values(map)
  }, [absensi, karyawan, today])

  if (loading) return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{[1,2,3].map((i) => <SkeletonCard key={i} />)}</div>

  return (
    <>
      <header className="mb-6">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">Per Area</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">Ringkasan kehadiran hari ini per cabang</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {perArea.map((a) => (
          <div key={a.area} className="bg-white dark:bg-gray-800 rounded-xl shadow p-5 transition-colors">
            <h3 className="font-bold text-gray-800 dark:text-white mb-2">{a.area}</h3>
            <p className="text-xs text-gray-400 mb-3">Total: {a.total} karyawan</p>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-2">
                <p className="text-lg font-bold text-green-600">{a.hadir}</p>
                <p className="text-[10px] text-gray-500">Hadir</p>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-2">
                <p className="text-lg font-bold text-red-500">{a.telat}</p>
                <p className="text-[10px] text-gray-500">Telat</p>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-2">
                <p className="text-lg font-bold text-yellow-600">{a.izin}</p>
                <p className="text-[10px] text-gray-500">Izin</p>
              </div>
              <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-2">
                <p className="text-lg font-bold text-orange-500">{a.sakit}</p>
                <p className="text-[10px] text-gray-500">Sakit</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
                <p className="text-lg font-bold text-gray-500">{a.alpha}</p>
                <p className="text-[10px] text-gray-500">Alpha</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
