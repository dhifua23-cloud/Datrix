import { useMemo } from 'react'

export default function FilterBar({ absensi, areaFilter, setAreaFilter, namaFilter, setNamaFilter }) {
  const daftarArea = useMemo(() => {
    const areas = new Set(absensi.map((d) => d.Area).filter(Boolean))
    return ['Semua Area', ...areas]
  }, [absensi])

  const daftarNama = useMemo(() => {
    const names = new Set(absensi.map((d) => d.Nama).filter(Boolean))
    return ['Semua Karyawan', ...names]
  }, [absensi])

  return (
    <div className="flex flex-wrap gap-3">
      <select
        value={areaFilter}
        onChange={(e) => setAreaFilter(e.target.value)}
        className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
      >
        {daftarArea.map((a) => (
          <option key={a} value={a}>{a}</option>
        ))}
      </select>

      <select
        value={namaFilter}
        onChange={(e) => setNamaFilter(e.target.value)}
        className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
      >
        {daftarNama.map((n) => (
          <option key={n} value={n}>{n}</option>
        ))}
      </select>
    </div>
  )
}
