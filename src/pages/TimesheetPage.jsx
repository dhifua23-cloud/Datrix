import { useState, useMemo } from 'react'
import { useApp } from '../context/AppContext'
import { SkeletonTable } from '../components/Skeleton'
import * as XLSX from 'xlsx'

const STATUS_WARNA = {
  Hadir: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  Telat: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  Izin: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  Sakit: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  Cuti: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  Off: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300',
  Alpha: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
}

const STATUS_SINGKAT = {
  Hadir: 'H',
  Telat: 'T',
  Izin: 'I',
  Sakit: 'S',
  Cuti: 'C',
  Off: 'O',
  Alpha: 'A',
}

export default function TimesheetPage() {
  const { absensi, karyawan, daftarArea, loading } = useApp()
  const [bulan, setBulan] = useState(new Date().getMonth())
  const [tahun, setTahun] = useState(new Date().getFullYear())
  const [areaFilter, setAreaFilter] = useState('Semua Area')
  const [cariNama, setCariNama] = useState('')

  const daftarAreaOptions = useMemo(() => {
    const areas = new Set()
    absensi.forEach((d) => { if (d.Area) areas.add(d.Area) })
    karyawan.forEach((k) => { if (k.Area) areas.add(k.Area) })
    if (daftarArea) daftarArea.forEach((a) => { if (a['Nama Area']) areas.add(a['Nama Area']) })
    return ['Semua Area', ...areas]
  }, [absensi, karyawan, daftarArea])

  const { hari, daftarKaryawan, dataMap } = useMemo(() => {
    const jmlHari = new Date(tahun, bulan + 1, 0).getDate()
    const hariArr = Array.from({ length: jmlHari }, (_, i) => i + 1)

    const map = {}
    absensi.forEach((d) => {
      if (!d.Tanggal) return
      const tgl = new Date(d.Tanggal)
      if (tgl.getMonth() !== bulan || tgl.getFullYear() !== tahun) return
      if (areaFilter !== 'Semua Area' && d.Area !== areaFilter) return
      const tglNum = tgl.getDate()
      const nama = (d.Nama || '').trim()
      if (!nama) return
      const key = `${nama}|${tglNum}`
      const st = (d['Status Kehadiran'] || '').toLowerCase()
      const sh = (d['Shift'] || d['shift'] || '').toLowerCase()
      if (sh === 'off') map[key] = 'Off'
      else if (st.includes('cuti')) map[key] = 'Cuti'
      else if (st === 'hadir' || st === 'telat' || st === 'izin' || st === 'sakit') map[key] = st.charAt(0).toUpperCase() + st.slice(1)
      else map[key] = d['Status Kehadiran'] || 'Alpha'
    })

    const filteredKaryawan = karyawan.filter((k) => {
      if (areaFilter !== 'Semua Area' && k.Area !== areaFilter) return false
      if (cariNama && !(k.Nama || '').toLowerCase().includes(cariNama.toLowerCase())) return false
      return k.Nama && k.Nama.trim()
    }).sort((a, b) => (a.Nama || '').localeCompare(b.Nama || ''))

    return { hari: hariArr, daftarKaryawan: filteredKaryawan, dataMap: map }
  }, [absensi, karyawan, bulan, tahun, areaFilter, cariNama])

  const namaBulan = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

  const getHariNama = (d) => {
    const day = new Date(tahun, bulan, d).getDay()
    return ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'][day]
  }

  const exportExcel = () => {
    const headerRow = ['Nama', ...hari.map((d) => `${d}\n${getHariNama(d)}`)]
    const dataRows = daftarKaryawan.map((k) => {
      return [k.Nama, ...hari.map((d) => dataMap[`${k.Nama}|${d}`] || 'Alpha')]
    })
    const ws = XLSX.utils.aoa_to_sheet([headerRow, ...dataRows])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Timesheet')
    XLSX.writeFile(wb, `timesheet_${namaBulan[bulan]}_${tahun}.xlsx`)
  }

  if (loading) return <SkeletonTable />

  return (
    <>
      <header className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">Timesheet</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Rekap kehadiran harian per karyawan</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input type="text" placeholder="Cari nama..." value={cariNama}
            onChange={(e) => setCariNama(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-white w-32" />
          <select value={areaFilter} onChange={(e) => setAreaFilter(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-white">
            {daftarAreaOptions.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
          <button onClick={exportExcel}
            className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700">Excel</button>
          <button onClick={() => { if (bulan === 0) { setBulan(11); setTahun(tahun - 1) } else setBulan(bulan - 1) }}
            className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">&lt;</button>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-32 text-center">{namaBulan[bulan]} {tahun}</span>
          <button onClick={() => { if (bulan === 11) { setBulan(0); setTahun(tahun + 1) } else setBulan(bulan + 1) }}
            className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">&gt;</button>
        </div>
      </header>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden transition-colors">
        <div className="overflow-x-auto max-h-[75vh] overflow-y-auto">
          <table className="w-full text-xs whitespace-nowrap">
            <thead className="sticky top-0 z-10">
              <tr className="bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                <th className="sticky left-0 z-20 bg-gray-50 dark:bg-gray-700 p-2 text-left min-w-[140px]">Nama</th>
                {hari.map((d) => (
                  <th key={d} className={`p-1.5 text-center min-w-[28px] ${getHariNama(d) === 'Min' ? 'text-red-400' : ''}`}>
                    {d}
                    <div className="text-[8px] text-gray-400">{getHariNama(d)}</div>
                  </th>
                ))}
                <th className="p-1.5 text-center text-green-600 min-w-[24px]">H</th>
                <th className="p-1.5 text-center text-red-500 min-w-[24px]">T</th>
                <th className="p-1.5 text-center text-yellow-600 min-w-[24px]">I</th>
                <th className="p-1.5 text-center text-orange-500 min-w-[24px]">S</th>
                <th className="p-1.5 text-center text-blue-500 min-w-[24px]">C</th>
                <th className="p-1.5 text-center text-pink-500 min-w-[24px]">O</th>
                <th className="p-1.5 text-center text-gray-500 min-w-[24px]">A</th>
              </tr>
            </thead>
            <tbody>
              {daftarKaryawan.map((k) => (
                <tr key={k.Nama} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="sticky left-0 z-10 bg-white dark:bg-gray-800 p-2 font-medium text-gray-800 dark:text-white whitespace-nowrap border-r border-gray-100 dark:border-gray-700">
                    {k.Nama}
                  </td>
                  {hari.map((d) => {
                    const key = `${k.Nama}|${d}`
                    const today = new Date()
                    const tglCell = new Date(tahun, bulan, d)
                    const isMasaDepan = tglCell > today
                    const adaData = dataMap[key]
                    const status = adaData || 'Alpha'

                    return (
                      <td key={d} className="p-1.5 text-center">
                        {adaData ? (
                          <span className={`inline-block w-6 h-6 rounded text-xs font-medium leading-6 ${STATUS_WARNA[status] || STATUS_WARNA.Alpha}`}>
                            {STATUS_SINGKAT[status] || 'A'}
                          </span>
                        ) : isMasaDepan ? (
                          <span className="text-gray-300 dark:text-gray-600">-</span>
                        ) : (
                          <span className={`inline-block w-6 h-6 rounded text-xs font-medium leading-6 ${STATUS_WARNA.Alpha}`}>
                            A
                          </span>
                        )}
                      </td>
                    )
                  })}
                  {(() => {
                    let h = 0, t = 0, i = 0, s = 0, c = 0, o = 0, a = 0
                    const today = new Date()
                    hari.forEach((d) => {
                      const st = dataMap[`${k.Nama}|${d}`]
                      if (st === 'Hadir') h++
                      else if (st === 'Telat') t++
                      else if (st === 'Izin') i++
                      else if (st === 'Sakit') s++
                      else if (st === 'Cuti') c++
                      else if (st === 'Off') o++
                      else if (new Date(tahun, bulan, d) < today) a++
                    })
                    return (
                      <>
                        <td className="p-1.5 text-center text-green-600 font-medium">{h}</td>
                        <td className="p-1.5 text-center text-red-500 font-medium">{t}</td>
                        <td className="p-1.5 text-center text-yellow-600 font-medium">{i}</td>
                        <td className="p-1.5 text-center text-orange-500 font-medium">{s}</td>
                        <td className="p-1.5 text-center text-blue-500 font-medium">{c}</td>
                        <td className="p-1.5 text-center text-pink-500 font-medium">{o}</td>
                        <td className="p-1.5 text-center text-gray-500 font-medium">{a}</td>
                      </>
                    )
                  })()}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex gap-3 mt-4 text-xs text-gray-500 dark:text-gray-400 flex-wrap">
        <span><span className="inline-block w-4 h-4 rounded bg-green-100 text-green-800 text-center text-[10px] leading-4 mr-1">H</span> Hadir</span>
        <span><span className="inline-block w-4 h-4 rounded bg-red-100 text-red-800 text-center text-[10px] leading-4 mr-1">T</span> Telat</span>
        <span><span className="inline-block w-4 h-4 rounded bg-yellow-100 text-yellow-800 text-center text-[10px] leading-4 mr-1">I</span> Izin</span>
        <span><span className="inline-block w-4 h-4 rounded bg-orange-100 text-orange-800 text-center text-[10px] leading-4 mr-1">S</span> Sakit</span>
        <span><span className="inline-block w-4 h-4 rounded bg-blue-100 text-blue-800 text-center text-[10px] leading-4 mr-1">C</span> Cuti</span>
        <span><span className="inline-block w-4 h-4 rounded bg-pink-100 text-pink-800 text-center text-[10px] leading-4 mr-1">O</span> Off</span>
        <span><span className="inline-block w-4 h-4 rounded bg-gray-100 text-gray-500 text-center text-[10px] leading-4 mr-1">A</span> Alpha</span>
      </div>
    </>
  )
}
