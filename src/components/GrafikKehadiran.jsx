import { useMemo, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts'

const GARIS = [
  { key: 'Hadir', warna: '#22c55e', label: 'Hadir' },
  { key: 'Telat', warna: '#ef4444', label: 'Telat' },
  { key: 'Izin', warna: '#eab308', label: 'Izin' },
  { key: 'Sakit', warna: '#f97316', label: 'Sakit' },
  { key: 'Cuti', warna: '#3b82f6', label: 'Cuti' },
  { key: 'Off', warna: '#ec4899', label: 'Off' },
  { key: 'Alpha', warna: '#9ca3af', label: 'Alpha' },
]

export default function GrafikKehadiran({ data, selectedDate }) {
  const [filter, setFilter] = useState(GARIS.map((g) => g.key))

  const { hasSelectedData, chartData } = useMemo(() => {
    const grouped = {}
    let selectedExists = false
    data.forEach((d) => {
      if (!d.Tanggal) return
      const tgl = d.Tanggal.slice(0, 10)
      if (selectedDate && tgl === selectedDate) selectedExists = true
      if (!grouped[tgl]) grouped[tgl] = { tanggal: tgl, Hadir: 0, Telat: 0, Izin: 0, Sakit: 0, Cuti: 0, Off: 0, Alpha: 0 }

      const status = (d['Status Kehadiran'] || '').toLowerCase()
      const shift = (d['Shift'] || d['shift'] || '').toLowerCase()

      if (shift === 'off') grouped[tgl].Off++
      else if (status.includes('cuti')) grouped[tgl].Cuti++
      else if (status === 'hadir') grouped[tgl].Hadir++
      else if (status === 'telat') grouped[tgl].Telat++
      else if (status === 'izin') grouped[tgl].Izin++
      else if (status === 'sakit') grouped[tgl].Sakit++
      else grouped[tgl].Alpha++
    })
    return {
      hasSelectedData: !selectedDate || selectedExists,
      chartData: Object.values(grouped).sort((a, b) => a.tanggal.localeCompare(b.tanggal)).slice(-30),
    }
  }, [data, selectedDate])

  const toggleFilter = (key) => {
    setFilter((prev) => prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key])
  }

  if (chartData.length === 0 || !hasSelectedData) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-5">
        <h2 className="text-lg font-semibold mb-3 text-gray-800 dark:text-white">Tren Kehadiran</h2>
        <p className="text-gray-400 text-sm">Belum ada data</p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-5 transition-colors">
      <h2 className="text-lg font-semibold mb-3 text-gray-800 dark:text-white">
        Tren Kehadiran {selectedDate ? `(${selectedDate})` : '(30 Hari)'}
      </h2>

      {/* Filter checkbox */}
      <div className="flex flex-wrap gap-3 mb-4">
        {GARIS.map((g) => (
          <label key={g.key} className="flex items-center gap-1.5 text-xs cursor-pointer select-none"
            style={{ color: g.warna }}>
            <input type="checkbox" checked={filter.includes(g.key)} onChange={() => toggleFilter(g.key)}
              className="accent-current w-3 h-3" />
            {g.label}
          </label>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="tanggal" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={60} />
          <YAxis />
          <Tooltip />
          <Legend />
          {GARIS.map((g, i) =>
            filter.includes(g.key) && (
              <Line key={g.key} type="monotone" dataKey={g.key} stroke={g.warna} strokeWidth={2}
                dot={{ r: 4, strokeWidth: 2 }} connectNulls animationBegin={i * 100} animationDuration={800} />
            )
          )}
          {selectedDate && <ReferenceLine x={selectedDate} stroke="#3b82f6" strokeDasharray="5 5" strokeWidth={2} label={{ value: 'Terpilih', position: 'top', fontSize: 10 }} />}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
