import { useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

export default function GrafikKehadiran({ data }) {
  const chartData = useMemo(() => {
    const grouped = {}
    data.forEach((d) => {
      if (!d.Tanggal) return
      const tgl = d.Tanggal.slice(0, 10)
      if (!grouped[tgl]) grouped[tgl] = { tanggal: tgl, Hadir: 0, Izin: 0, Sakit: 0, Alpha: 0 }
      const status = d['Status Kehadiran']
      if (status === 'Hadir') grouped[tgl].Hadir++
      else if (status === 'Izin') grouped[tgl].Izin++
      else if (status === 'Sakit') grouped[tgl].Sakit++
      else grouped[tgl].Alpha++
    })

    return Object.values(grouped)
      .sort((a, b) => a.tanggal.localeCompare(b.tanggal))
      .slice(-30)
  }, [data])

  if (chartData.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow p-5">
        <h2 className="text-lg font-semibold mb-3">Tren Kehadiran</h2>
        <p className="text-gray-400 text-sm">Belum ada data</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow p-5">
      <h2 className="text-lg font-semibold mb-3">Tren Kehadiran (30 Hari)</h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="tanggal" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={60} />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="Hadir" stroke="#22c55e" strokeWidth={2} />
          <Line type="monotone" dataKey="Izin" stroke="#eab308" strokeWidth={2} />
          <Line type="monotone" dataKey="Sakit" stroke="#f97316" strokeWidth={2} />
          <Line type="monotone" dataKey="Alpha" stroke="#ef4444" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
