import { useState, useMemo } from 'react'
import { useApp } from '../context/AppContext'
import { SkeletonTable } from '../components/Skeleton'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export default function EmployeeMovementPage({ type = 'in' }) {
  const { karyawan, loading, showToast } = useApp()
  const [tahun, setTahun] = useState(new Date().getFullYear())
  const [bulan, setBulan] = useState('Semua')
  const [areaFilter, setAreaFilter] = useState('Semua Area')

  const isIn = type === 'in'
  const label = isIn ? 'Employee In' : 'Employee Out'
  const kolom = isIn ? 'Employee In' : 'Employee Out'

  const daftarArea = useMemo(() => {
    return ['Semua Area', ...new Set(karyawan.map((k) => k.Area).filter(Boolean))]
  }, [karyawan])

  const data = useMemo(() => {
    return karyawan.filter((k) => {
      const tgl = k[kolom]
      if (!tgl) return false
      const d = new Date(tgl)
      if (isNaN(d.getTime())) return false
      if (d.getFullYear() !== tahun) return false
      if (bulan !== 'Semua' && d.getMonth() + 1 !== parseInt(bulan)) return false
      if (areaFilter !== 'Semua Area' && k.Area !== areaFilter) return false
      return true
    }).sort((a, b) => {
      const da = new Date(a[kolom]), db = new Date(b[kolom])
      return da - db
    })
  }, [karyawan, kolom, tahun, bulan, areaFilter])

  const namaBulan = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

  const exportExcel = () => {
    const rows = data.map((k, i) => ({
      No: i + 1, 'Employee ID': k['Employee Id'], Nama: k.Nama, Area: k.Area,
      Jabatan: k.Jabatan, Status: k.Status, Tanggal: k[kolom],
    }))
    const ws = XLSX.utils.json_to_sheet(rows); const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, label)
    XLSX.writeFile(wb, `${label.replace(/\s/g, '_')}_${tahun}.xlsx`)
    showToast('Download Excel berhasil')
  }

  const exportPDF = () => {
    const doc = new jsPDF('landscape')
    doc.text(`${label} ${tahun}`, 14, 15)
    const headers = [['No', 'ID', 'Nama', 'Area', 'Jabatan', 'Status', 'Tanggal']]
    const rows = data.map((k, i) => [i + 1, k['Employee Id'], k.Nama, k.Area, k.Jabatan, k.Status, k[kolom]])
    doc.autoTable({ head: headers, body: rows, styles: { fontSize: 8 }, headStyles: { fillColor: [59, 130, 246] } })
    doc.save(`${label.replace(/\s/g, '_')}_${tahun}.pdf`)
    showToast('Download PDF berhasil')
  }

  if (loading) return <SkeletonTable />

  return (
    <>
      <header className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">{label}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">{data.length} karyawan</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select value={areaFilter} onChange={(e) => setAreaFilter(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-white">
            {daftarArea.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
          <select value={bulan} onChange={(e) => setBulan(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-white">
            <option value="Semua">Semua Bulan</option>
            {namaBulan.slice(1).map((b, i) => <option key={i + 1} value={i + 1}>{b}</option>)}
          </select>
          <button onClick={() => setTahun(tahun - 1)}
            className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">&lt;</button>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-20 text-center">{tahun}</span>
          <button onClick={() => setTahun(tahun + 1)}
            className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">&gt;</button>
          <button onClick={exportExcel}
            className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700">Excel</button>
          <button onClick={exportPDF}
            className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700">PDF</button>
        </div>
      </header>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 dark:text-gray-400 border-b bg-gray-50 dark:bg-gray-800/50">
                <th className="p-3">No</th>
                <th className="p-3">ID</th>
                <th className="p-3">Nama</th>
                <th className="p-3">Area</th>
                <th className="p-3">Jabatan</th>
                <th className="p-3">Status</th>
                <th className="p-3">Tanggal</th>
              </tr>
            </thead>
            <tbody>
              {data.map((k, i) => (
                <tr key={i} className="border-b last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="p-3 text-gray-500">{i + 1}</td>
                  <td className="p-3 text-gray-600 dark:text-gray-400">{k['Employee Id']}</td>
                  <td className="p-3 font-medium text-gray-800 dark:text-white">{k.Nama}</td>
                  <td className="p-3 text-gray-600 dark:text-gray-400">{k.Area}</td>
                  <td className="p-3 text-gray-600 dark:text-gray-400">{k.Jabatan}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${k.Status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {k.Status}
                    </span>
                  </td>
                  <td className="p-3 text-gray-600 dark:text-gray-400">{k[kolom]}</td>
                </tr>
              ))}
              {data.length === 0 && (
                <tr><td colSpan={7} className="p-6 text-center text-gray-400">Belum ada data</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
