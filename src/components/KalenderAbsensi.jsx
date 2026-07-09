import { useMemo, useState } from 'react'

const STATUS_WARNA = {
  Hadir: 'bg-green-500',
  Telat: 'bg-red-400',
  Izin: 'bg-yellow-400',
  Sakit: 'bg-orange-400',
  Alpha: 'bg-gray-300',
}

export default function KalenderAbsensi({ absensi, onSelectDate }) {
  const now = new Date()
  const [bulan, setBulan] = useState(now.getMonth())
  const [tahun, setTahun] = useState(now.getFullYear())

  const daysInMonth = new Date(tahun, bulan + 1, 0).getDate()
  const firstDay = new Date(tahun, bulan).getDay()

  const dataPerTanggal = useMemo(() => {
    const map = {}
    absensi.forEach((d) => {
      if (!d.Tanggal) return
      const tgl = d.Tanggal.slice(0, 10)
      if (!map[tgl]) map[tgl] = {}
      const nik = d.NIK || 'unknown'
      map[tgl][nik] = d['Status Kehadiran'] || 'Alpha'
    })
    return map
  }, [absensi])

  const namaBulan = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
  const hari = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']

  const prevMonth = () => {
    if (bulan === 0) { setBulan(11); setTahun(tahun - 1) }
    else setBulan(bulan - 1)
  }

  const nextMonth = () => {
    if (bulan === 11) { setBulan(0); setTahun(tahun + 1) }
    else setBulan(bulan + 1)
  }

  const tanggalKey = (d) => `${tahun}-${String(bulan + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`

  return (
    <div className="bg-white rounded-xl shadow p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Kalender Absensi</h2>
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="px-2 py-1 text-sm border rounded hover:bg-gray-100">&lt;</button>
          <span className="text-sm font-medium">{namaBulan[bulan]} {tahun}</span>
          <button onClick={nextMonth} className="px-2 py-1 text-sm border rounded hover:bg-gray-100">&gt;</button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {hari.map((h) => (
          <div key={h} className="text-center text-xs text-gray-500 font-medium py-1">{h}</div>
        ))}
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1
          const key = tanggalKey(day)
          const dataHari = dataPerTanggal[key]
          const statuses = dataHari ? Object.values(dataHari) : []
          const uniqueStatuses = [...new Set(statuses)]
          const isToday = day === now.getDate() && bulan === now.getMonth() && tahun === now.getFullYear()

          return (
            <div key={day} onClick={() => onSelectDate?.(key)} className={`border rounded-lg p-1.5 min-h-[60px] cursor-pointer hover:shadow-md transition-shadow ${isToday ? 'border-blue-400 bg-blue-50' : 'border-gray-100'}`}>
              <p className={`text-xs font-medium ${isToday ? 'text-blue-600' : 'text-gray-600'}`}>{day}</p>
              <div className="mt-1 space-y-0.5">
                {uniqueStatuses.slice(0, 3).map((s, j) => (
                  <div key={j} className={`w-2 h-2 rounded-full ${STATUS_WARNA[s] || 'bg-gray-300'} inline-block mr-0.5`} title={s} />
                ))}
                {uniqueStatuses.length > 3 && (
                  <span className="text-[10px] text-gray-400">+{uniqueStatuses.length - 3}</span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex gap-4 mt-4 text-xs text-gray-500">
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" /> Hadir</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block" /> Telat</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-yellow-400 inline-block" /> Izin</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-orange-400 inline-block" /> Sakit</span>
      </div>
    </div>
  )
}
