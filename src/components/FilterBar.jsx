import { useMemo } from 'react'

export default function FilterBar({ absensi, areaList, areaFilter, setAreaFilter, namaFilter, setNamaFilter }) {
  const daftarArea = useMemo(() => {
    const areas = new Set()
    absensi.forEach((d) => { if (d.Area) areas.add(d.Area) })
    if (areaList) areaList.forEach((a) => { if (a['Nama Area']) areas.add(a['Nama Area']) })
    return ['Semua Area', ...areas]
  }, [absensi, areaList])

  const daftarNama = useMemo(() => {
    const names = new Set(absensi.map((d) => d.Nama).filter(Boolean))
    return ['Semua Karyawan', ...names]
  }, [absensi])

  return (
    <div className="flex flex-wrap gap-3">
      <select value={areaFilter} onChange={(e) => setAreaFilter(e.target.value)}
        className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-white">
        {daftarArea.map((a) => <option key={a} value={a}>{a}</option>)}
      </select>
      <select value={namaFilter} onChange={(e) => setNamaFilter(e.target.value)}
        className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-white">
        {daftarNama.map((n) => <option key={n} value={n}>{n}</option>)}
      </select>
    </div>
  )
}
