const cards = [
  { label: 'Hadir', color: 'bg-green-500', key: 'Hadir' },
  { label: 'Telat', color: 'bg-red-400', key: 'Telat' },
  { label: 'Izin', color: 'bg-yellow-500', key: 'Izin' },
  { label: 'Sakit', color: 'bg-orange-500', key: 'Sakit' },
]

export default function SummaryCards({ data }) {
  const today = new Date().toISOString().slice(0, 10)
  const todayData = data.filter((d) => d.Tanggal?.startsWith(today))

  const counts = {
    Hadir: todayData.filter((d) => d['Status Kehadiran'] === 'Hadir').length,
    Telat: todayData.filter((d) => d['Status Kehadiran'] === 'Telat').length,
    Izin: todayData.filter((d) => d['Status Kehadiran'] === 'Izin').length,
    Sakit: todayData.filter((d) => d['Status Kehadiran'] === 'Sakit').length,
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((c) => (
        <div key={c.key} className="bg-white rounded-xl shadow p-5 flex items-center gap-4">
          <div className={`w-12 h-12 rounded-lg ${c.color} flex items-center justify-center text-white text-xl font-bold`}>
            {counts[c.key]}
          </div>
          <div>
            <p className="text-sm text-gray-500">{c.label}</p>
            <p className="text-2xl font-bold">{counts[c.key]}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
