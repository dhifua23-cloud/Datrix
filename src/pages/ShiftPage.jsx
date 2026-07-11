import { useState, useMemo } from 'react'
import { useApp } from '../context/AppContext'
import { APPS_SCRIPT_URL } from '../config'
import { SkeletonTable } from '../components/Skeleton'
import * as XLSX from 'xlsx'

const PILIHAN_SHIFT = ['', 'Shift 1', 'Shift 2', 'Shift 3', 'Malam', 'Pagi', 'Siang', 'Libur', 'Off']
const WARNA_SHIFT = {
  'Shift 1': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  'Shift 2': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  'Shift 3': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
  'Malam': 'bg-gray-800 text-white dark:bg-gray-200 dark:text-gray-800',
  'Pagi': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  'Siang': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  'Libur': 'bg-red-50 text-red-400 dark:bg-red-900/10 dark:text-red-300',
  'Off': 'bg-green-50 text-green-600 dark:bg-green-900/10 dark:text-green-400',
}

export default function ShiftPage() {
  const { absensi, shiftMap, daftarArea, loading, showToast } = useApp()
  const [bulan, setBulan] = useState(new Date().getMonth())
  const [tahun, setTahun] = useState(new Date().getFullYear())
  const [areaFilter, setAreaFilter] = useState('Semua Area')
  const [editCell, setEditCell] = useState(null)

  const absensiShiftMap = useMemo(() => {
    const map = {}
    absensi.forEach((d) => {
      if (!d.Tanggal || !d.Shift) return
      const tgl = new Date(d.Tanggal)
      if (tgl.getMonth() !== bulan || tgl.getFullYear() !== tahun) return
      const nama = (d.Nama || '').trim().toLowerCase()
      const tglKey = `${tahun}-${String(bulan + 1).padStart(2, '0')}-${String(tgl.getDate()).padStart(2, '0')}`
      const key = `${nama}|${tglKey}`
      if (!map[key]) map[key] = d.Shift
    })
    return map
  }, [absensi, bulan, tahun])

  const daftarAreaOptions = useMemo(() => {
    const areas = new Set()
    absensi.forEach((d) => { if (d.Area) areas.add(d.Area) })
    if (daftarArea) daftarArea.forEach((a) => { if (a['Nama Area']) areas.add(a['Nama Area']) })
    return ['Semua Area', ...areas]
  }, [absensi, daftarArea])

  const { hari, daftarKaryawan } = useMemo(() => {
    const jmlHari = new Date(tahun, bulan + 1, 0).getDate()
    const hariArr = Array.from({ length: jmlHari }, (_, i) => i + 1)
    const karyawanSet = new Set()
    absensi.forEach((d) => {
      if (!d.Tanggal) return
      const tgl = new Date(d.Tanggal)
      if (tgl.getMonth() !== bulan || tgl.getFullYear() !== tahun) return
      if (areaFilter !== 'Semua Area' && d.Area !== areaFilter) return
      const nama = (d.Nama || '').trim()
      if (nama) karyawanSet.add(nama)
    })
    return { hari: hariArr, daftarKaryawan: [...karyawanSet].sort() }
  }, [absensi, bulan, tahun, areaFilter])

  const getShift = (nama, tgl) => {
    const key = `${nama.toLowerCase()}|${tahun}-${String(bulan + 1).padStart(2, '0')}-${String(tgl).padStart(2, '0')}`
    return shiftMap[key] || absensiShiftMap[key] || ''
  }

  const changeShift = async (nama, tgl, value) => {
    const tanggal = `${tahun}-${String(bulan + 1).padStart(2, '0')}-${String(tgl).padStart(2, '0')}`
    try {
      await fetch(APPS_SCRIPT_URL, {
        method: 'POST', mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'save_shift', nama, tanggal, shift: value }),
      })
      setEditCell(null)
      showToast('Shift tersimpan, refresh data')
    } catch (err) {
      showToast('Gagal: ' + err.message, 'error')
    }
  }

  const getHariNama = (d) => ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'][new Date(tahun, bulan, d).getDay()]

  const exportExcel = () => {
    const header = ['Nama', ...hari.map((d) => `${d}`)]
    const rows = daftarKaryawan.map((nama) => [nama, ...hari.map((d) => getShift(nama, d) || '')])
    const ws = XLSX.utils.aoa_to_sheet([header, ...rows]); const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Shift'); XLSX.writeFile(wb, `shift_${bulan + 1}_${tahun}.xlsx`)
  }

  const namaBulan = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

  if (loading) return <SkeletonTable />

  return (
    <>
      <header className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">Jadwal Shift</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">{namaBulan[bulan]} {tahun}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select value={areaFilter} onChange={(e) => setAreaFilter(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-white">
            {daftarAreaOptions.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
          <button onClick={() => { if (bulan === 0) { setBulan(11); setTahun(tahun - 1) } else setBulan(bulan - 1) }}
            className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-100 dark:border-gray-600">&lt;</button>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-32 text-center">{namaBulan[bulan]} {tahun}</span>
          <button onClick={() => { if (bulan === 11) { setBulan(0); setTahun(tahun + 1) } else setBulan(bulan + 1) }}
            className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-100 dark:border-gray-600">&gt;</button>
          <button onClick={exportExcel}
            className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700">Excel</button>
        </div>
      </header>

      <div className="flex gap-2 mb-4 text-xs text-gray-500 flex-wrap">
        {PILIHAN_SHIFT.filter(Boolean).map((s) => (
          <span key={s}><span className={`inline-block w-3 h-3 rounded align-middle mr-1 ${WARNA_SHIFT[s]?.split(' ')[0] || 'bg-gray-100'}`}></span> {s}</span>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden transition-colors">
        <div className="overflow-x-auto max-h-[75vh] overflow-y-auto">
          <table className="w-full text-xs whitespace-nowrap">
            <thead className="sticky top-0 z-10">
              <tr className="bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                <th className="sticky left-0 z-20 bg-gray-50 dark:bg-gray-700 p-2 text-left min-w-[130px]">Nama</th>
                {hari.map((d) => (
                  <th key={d} className={`p-1.5 text-center min-w-[32px] ${getHariNama(d) === 'Min' ? 'text-red-400' : ''}`}>
                    {d}<div className="text-[8px] text-gray-400">{getHariNama(d)}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {daftarKaryawan.map((nama) => (
                <tr key={nama} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="sticky left-0 z-10 bg-white dark:bg-gray-800 p-2 font-medium text-gray-800 dark:text-white">{nama}</td>
                  {hari.map((d) => {
                    const shift = getShift(nama, d)
                    const editing = editCell === `${nama}|${d}`
                    return (
                      <td key={d} className="p-1 text-center cursor-pointer" onClick={() => setEditCell(`${nama}|${d}`)}>
                        {editing ? (
                          <select value={shift} onChange={(e) => changeShift(nama, d, e.target.value)}
                            className="w-full text-[9px] p-0.5 border rounded bg-white dark:bg-gray-700"
                            autoFocus onBlur={() => setEditCell(null)}>
                            <option value="">-</option>
                            {PILIHAN_SHIFT.filter(Boolean).map((s) => <option key={s} value={s}>{s}</option>)}
                          </select>
                        ) : shift ? (
                          <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-medium ${WARNA_SHIFT[shift] || 'bg-gray-100 text-gray-500'}`}>{shift}</span>
                        ) : (
                          <span className="text-gray-200 dark:text-gray-700">-</span>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
