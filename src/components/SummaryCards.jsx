import { useState } from 'react'

const cards = [
  { label: 'Hadir', color: 'bg-green-500', key: 'Hadir' },
  { label: 'Telat', color: 'bg-red-400', key: 'Telat' },
  { label: 'Izin', color: 'bg-yellow-500', key: 'Izin' },
  { label: 'Sakit', color: 'bg-orange-500', key: 'Sakit' },
  { label: 'Cuti', color: 'bg-blue-500', key: 'Cuti' },
  { label: 'Off', color: 'bg-pink-500', key: 'Off' },
]

export default function SummaryCards({ data, onLihat }) {
  const [selected, setSelected] = useState(null)
  const today = new Date().toISOString().slice(0, 10)
  const todayData = data.filter((d) => d.Tanggal?.startsWith(today))

  const getList = (key) => {
    let filtered = []
    if (key === 'Hadir') filtered = todayData.filter((d) => d['Status Kehadiran'] === 'Hadir')
    else if (key === 'Telat') filtered = todayData.filter((d) => d['Status Kehadiran'] === 'Telat')
    else if (key === 'Izin') filtered = todayData.filter((d) => d['Status Kehadiran'] === 'Izin')
    else if (key === 'Sakit') filtered = todayData.filter((d) => d['Status Kehadiran'] === 'Sakit')
    else if (key === 'Cuti') filtered = todayData.filter((d) => (d['Status Kehadiran'] || '').toLowerCase().includes('cuti'))
    else if (key === 'Off') filtered = todayData.filter((d) => (d['Shift'] || d['shift'] || '').toLowerCase() === 'off')
    return filtered
  }

  const handleClick = (key) => {
    const list = getList(key)
    if (list.length === 0) return
    setSelected({ key, label: cards.find((c) => c.key === key).label, list })
  }

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {cards.map((c) => {
          const list = getList(c.key)
          return (
            <button key={c.key} onClick={() => handleClick(c.key)}
              className={`bg-white dark:bg-gray-800 rounded-xl shadow p-4 flex items-center gap-3 transition-all text-left w-full ${list.length > 0 ? 'cursor-pointer hover:shadow-md' : ''} ${selected?.key === c.key ? 'ring-2 ring-blue-500' : ''}`}>
              <div className={`w-10 h-10 rounded-lg ${c.color} flex items-center justify-center text-white text-base font-bold flex-shrink-0`}>
                {list.length}
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-500 dark:text-gray-400">{c.label}</p>
                <p className="text-xl font-bold text-gray-800 dark:text-white">{list.length}</p>
              </div>
            </button>
          )
        })}
      </div>

      {/* Modal detail */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelected(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-800 dark:text-white">{selected.label} - {selected.list.length} karyawan</h2>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            </div>
            <div className="p-5">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                    <th className="pb-2">Nama</th>
                    <th className="pb-2">Area</th>
                    <th className="pb-2">Jam</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.list.map((d, i) => (
                    <tr key={i} className="border-b border-gray-100 dark:border-gray-700 last:border-0">
                      <td className="py-2">
                        <button onClick={() => { onLihat?.(d.Nama); setSelected(null) }}
                          className="font-medium hover:underline text-left text-gray-800 dark:text-white">
                          {d.Nama}
                        </button>
                      </td>
                      <td className="py-2 text-gray-600 dark:text-gray-400">{d.Area}</td>
                      <td className="py-2 text-gray-800 dark:text-white">{d['Jam Masuk'] || '-'}</td>
                    </tr>
                  ))}
                  {selected.list.length === 0 && (
                    <tr><td colSpan={3} className="py-4 text-center text-gray-400">Tidak ada data</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
