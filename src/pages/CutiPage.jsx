import { useState, useMemo } from 'react'
import { useApp } from '../context/AppContext'
import { APPS_SCRIPT_URL } from '../config'
import { SkeletonTable } from '../components/Skeleton'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export default function CutiPage() {
  const { absensi, karyawan, loading, showToast } = useApp()
  const [tahun, setTahun] = useState(new Date().getFullYear())
  const [areaFilter, setAreaFilter] = useState('Semua Area')
  const [edit, setEdit] = useState(null)
  const [form, setForm] = useState({ cutiTotal: 12, cutiSisa: 12 })
  const [history, setHistory] = useState(null)

  const daftarArea = useMemo(() => {
    return ['Semua Area', ...new Set(karyawan.map((k) => k.Area).filter(Boolean))]
  }, [karyawan])

  const dataCuti = useMemo(() => {
    const cutiDiambil = {}
    absensi.forEach((d) => {
      if (!d.Tanggal) return
      const tgl = new Date(d.Tanggal)
      if (tgl.getFullYear() !== tahun) return
      const status = (d['Status Kehadiran'] || '').toLowerCase()
      if (status !== 'izin' && !status.includes('cuti')) return
      const nama = (d.Nama || '').trim()
      if (!nama) return
      if (!cutiDiambil[nama]) cutiDiambil[nama] = { nama, nik: d.NIK, total: 0, riwayat: [] }
      cutiDiambil[nama].total++
      const tipe = d['Tipe Izin/Cuti'] || d['Status Kehadiran']?.replace('IZIN: ', '') || 'Izin'
      cutiDiambil[nama].riwayat.push({
        tanggal: d.Tanggal?.slice(0, 10),
        tipe,
        alasan: d['Alasan Izin'] || '-',
        status: 'Approved',
        approvedBy: d['Pemberi izin Lembur'] || '-',
      })
    })

    const filtered = karyawan.filter((k) => {
      if (areaFilter !== 'Semua Area' && k.Area !== areaFilter) return false
      return k.Nama && k.Nama.trim()
    })

    return filtered.map((k) => {
      const nama = (k.Nama || '').trim()
      const cuti = cutiDiambil[nama] || { total: 0, riwayat: [] }
      return {
        id: k['Employee Id'] || '',
        nama: k.Nama,
        area: k.Area,
        totalTahun: 12,
        sudahDiambil: cuti.total,
        sisa: 12 - cuti.total,
        riwayat: cuti.riwayat,
      }
    })
  }, [absensi, karyawan, tahun, areaFilter])

  const exportExcel = () => {
    const rows = dataCuti.map((d, i) => ({ No: i + 1, Nama: d.nama, Area: d.area, 'Jatah Cuti': d.totalTahun, 'Diambil': d.sudahDiambil, Sisa: d.sisa }))
    const ws = XLSX.utils.json_to_sheet(rows); const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Cuti')
    XLSX.writeFile(wb, `cuti_${tahun}.xlsx`)
    showToast('Download Excel berhasil')
  }

  const exportPDF = () => {
    const doc = new jsPDF()
    doc.text(`Tracking Cuti ${tahun}`, 14, 15)
    const rows = dataCuti.map((d, i) => [i + 1, d.nama, d.area, d.totalTahun, d.sudahDiambil, d.sisa])
    doc.autoTable({ head: [['No', 'Nama', 'Area', 'Jatah', 'Diambil', 'Sisa']], body: rows, styles: { fontSize: 7 }, headStyles: { fillColor: [59, 130, 246] } })
    doc.save(`cuti_${tahun}.pdf`)
    showToast('Download PDF berhasil')
  }

  if (loading) return <SkeletonTable />

  return (
    <>
      <header className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">Tracking Cuti</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Sisa cuti tahunan per karyawan</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select value={areaFilter} onChange={(e) => setAreaFilter(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-white">
            {daftarArea.map((a) => <option key={a} value={a}>{a}</option>)}
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
                <th className="p-3">Nama</th>
                <th className="p-3">Area</th>
                <th className="p-3 text-center">Jatah</th>
                <th className="p-3 text-center">Diambil</th>
                <th className="p-3 text-center">Sisa</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {dataCuti.map((d, i) => (
                <tr key={i} className="border-b last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="p-3 font-medium text-gray-800 dark:text-white">{d.nama}</td>
                  <td className="p-3 text-gray-600 dark:text-gray-400">{d.area}</td>
                  <td className="p-3 text-center text-gray-600 dark:text-gray-400">{d.totalTahun}</td>
                  <td className="p-3 text-center text-yellow-600">{d.sudahDiambil}</td>
                  <td className={`p-3 text-center font-bold ${d.sisa <= 0 ? 'text-red-600' : d.sisa <= 3 ? 'text-orange-500' : 'text-green-600'}`}>{d.sisa}</td>
                  <td className="p-3">
                    <button onClick={() => setHistory(d)}
                      className="text-xs px-2 py-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded">Riwayat</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Riwayat Modal */}
      {history && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setHistory(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-800 dark:text-white">Riwayat Cuti - {history.nama}</h2>
              <button onClick={() => setHistory(null)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            </div>
            <div className="p-5">
              <p className="text-sm text-gray-500 mb-3">Sisa cuti: <span className="font-bold text-blue-600">{history.sisa}</span> hari</p>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b">
                    <th className="pb-2">Tanggal</th>
                    <th className="pb-2">Tipe</th>
                    <th className="pb-2">Alasan</th>
                    <th className="pb-2">Status</th>
                    <th className="pb-2">Approved By</th>
                  </tr>
                </thead>
                <tbody>
                  {history.riwayat.length === 0 && <tr><td colSpan={5} className="py-4 text-center text-gray-400">Belum ada riwayat cuti</td></tr>}
                  {history.riwayat.map((r, j) => (
                    <tr key={j} className="border-b last:border-0">
                      <td className="py-2">{r.tanggal}</td>
                      <td className="py-2 text-yellow-600">{r.tipe}</td>
                      <td className="py-2 text-gray-500">{r.alasan}</td>
                      <td className="py-2"><span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">✓ {r.status}</span></td>
                      <td className="py-2 text-gray-500">{r.approvedBy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
