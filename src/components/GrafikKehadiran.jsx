import { useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts'

export default function GrafikKehadiran({ data, selectedDate }) {
  const { hasSelectedData, chartData } = useMemo(() => {
    const grouped = {}
    let selectedExists = false
    data.forEach((d) => {
      if (!d.Tanggal) return
      const tgl = d.Tanggal.slice(0, 10)
      if (selectedDate && tgl === selectedDate) selectedExists = true
      if (!grouped[tgl]) grouped[tgl] = { tanggal: tgl, Hadir: 0, Telat: 0, Izin: 0, Sakit: 0, Alpha: 0 }
      const status = d['Status Kehadiran']
      if (grouped[tgl][status] !== undefined) grouped[tgl][status]++
      else grouped[tgl].Alpha++
    })
    return {
      hasSelectedData: !selectedDate || selectedExists,
      chartData: Object.values(grouped).sort((a, b) => a.tanggal.localeCompare(b.tanggal)).slice(-30),
    }
  }, [data, selectedDate])

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
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="tanggal" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={60} />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="Hadir" stroke="#22c55e" strokeWidth={2} dot={{ r: 4, strokeWidth: 2 }} connectNulls animationBegin={0} animationDuration={800} />
          <Line type="monotone" dataKey="Telat" stroke="#ef4444" strokeWidth={2} dot={{ r: 4, strokeWidth: 2 }} connectNulls animationBegin={100} animationDuration={800} />
          <Line type="monotone" dataKey="Izin" stroke="#eab308" strokeWidth={2} dot={{ r: 4, strokeWidth: 2 }} connectNulls animationBegin={200} animationDuration={800} />
          <Line type="monotone" dataKey="Sakit" stroke="#f97316" strokeWidth={2} dot={{ r: 4, strokeWidth: 2 }} connectNulls animationBegin={300} animationDuration={800} />
          <Line type="monotone" dataKey="Alpha" stroke="#9ca3af" strokeWidth={2} dot={{ r: 4, strokeWidth: 2 }} connectNulls animationBegin={400} animationDuration={800} />
          {selectedDate && <ReferenceLine x={selectedDate} stroke="#3b82f6" strokeDasharray="5 5" strokeWidth={2} label={{ value: 'Terpilih', position: 'top', fontSize: 10 }} />}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
