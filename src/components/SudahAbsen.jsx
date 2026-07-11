import { useMemo } from 'react'

const STATUS_WARNA = {
  Hadir: 'text-green-600 bg-green-50 dark:bg-green-900/20',
  Telat: 'text-red-600 bg-red-50 dark:bg-red-900/20',
  Izin: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20',
  Sakit: 'text-orange-600 bg-orange-50 dark:bg-orange-900/20',
  Cuti: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20',
  Off: 'text-pink-600 bg-pink-50 dark:bg-pink-900/20',
  Alpha: 'text-gray-500 bg-gray-50 dark:bg-gray-800',
}

export default function SudahAbsen({ absensi, onLihat }) {
  const today = new Date().toISOString().slice(0, 10)
  const todayData = absensi.filter((d) => d.Tanggal?.startsWith(today))

  const statusOrder = { Hadir: 1, Telat: 2, Izin: 3, Sakit: 4, Cuti: 5, Off: 6, Alpha: 7 }

  const grouped = useMemo(() => {
    const map = {}
    todayData.forEach((d) => {
      const nama = d.Nama || ''
      if (!nama) return
      const status = d['Status Kehadiran'] || 'Alpha'
      const shift = (d['Shift'] || '').toLowerCase()
      let label = status
      if (shift === 'off') label = 'Off'
      else if (status.toLowerCase().includes('cuti')) label = 'Cuti'
      if (!map[nama]) map[nama] = { nama, area: d.Area, jamMasuk: d['Jam Masuk'] || '-', status: label, sort: statusOrder[label] || 99 }
    })
    return Object.values(map).sort((a, b) => a.sort - b.sort || a.nama.localeCompare(b.nama))
  }, [todayData])

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-5">
      <h2 className="text-lg font-semibold mb-3 text-gray-800 dark:text-white">Kehadiran Hari Ini ({grouped.length})</h2>
      {grouped.length === 0 ? (
        <p className="text-gray-400 text-sm">Belum ada data</p>
      ) : (
        <div className="overflow-x-auto max-h-64 overflow-y-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                <th className="pb-2">Nama</th>
                <th className="pb-2">Area</th>
                <th className="pb-2">Jam</th>
                <th className="pb-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {grouped.map((d, i) => (
                <tr key={i} className="border-b border-gray-100 dark:border-gray-700 last:border-0">
                  <td className="py-2">
                    <button onClick={() => onLihat?.(d.nama)}
                      className="font-medium hover:underline text-left text-gray-800 dark:text-white">
                      {d.nama}
                    </button>
                  </td>
                  <td className="py-2 text-gray-600 dark:text-gray-400">{d.area}</td>
                  <td className="py-2 text-gray-800 dark:text-white">{d.jamMasuk}</td>
                  <td className="py-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_WARNA[d.status] || 'bg-gray-100 text-gray-500'}`}>
                      {d.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
