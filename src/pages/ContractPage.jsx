import { useState, useMemo } from 'react'
import { useApp } from '../context/AppContext'
import { APPS_SCRIPT_URL } from '../config'
import { SkeletonTable } from '../components/Skeleton'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export default function ContractPage() {
  const { karyawan, loading, showToast, refreshData } = useApp()
  const [areaFilter, setAreaFilter] = useState('Semua Area')
  const [filterStatus, setFilterStatus] = useState('semua')
  const [edit, setEdit] = useState(null)
  const [form, setForm] = useState({ kontrakAkhir: '' })

  const daftarArea = useMemo(() => {
    return ['Semua Area', ...new Set(karyawan.map((k) => k.Area).filter(Boolean))]
  }, [karyawan])

  const data = useMemo(() => {
    const today = new Date()
    const in30Hari = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)

    return karyawan
      .filter((k) => {
        if (areaFilter !== 'Semua Area' && k.Area !== areaFilter) return false
        if (k.Status !== 'Active') return false
        return k.Nama && k.Nama.trim()
      })
      .map((k) => {
        const akhir = k['Kontrak Akhir'] || ''
        const tglAkhir = akhir ? new Date(akhir) : null
        const sisaHari = tglAkhir ? Math.ceil((tglAkhir - new Date()) / (1000 * 60 * 60 * 24)) : null
        const statusKon = akhir ? (sisaHari < 0 ? 'expired' : sisaHari <= 30 ? 'warning' : 'aman') : 'kosong'
        return {
          id: k['Employee Id'] || '',
          nama: k.Nama || '',
          area: k.Area || '',
          jabatan: k.Jabatan || '',
          kontrakAkhir: akhir,
          sisaHari,
          statusKon,
        }
      })
      .filter((d) => {
        if (filterStatus === 'semua') return true
        return d.statusKon === filterStatus
      })
      .sort((a, b) => {
        if (a.statusKon === 'expired' && b.statusKon !== 'expired') return -1
        if (a.statusKon !== 'expired' && b.statusKon === 'expired') return 1
        if (a.statusKon === 'warning' && b.statusKon !== 'warning') return -1
        if (a.statusKon !== 'warning' && b.statusKon === 'warning') return 1
        return (a.sisaHari || 999) - (b.sisaHari || 999)
      })
  }, [karyawan, areaFilter, filterStatus])

  const expiredCount = data.filter((d) => d.statusKon === 'expired').length
  const warningCount = data.filter((d) => d.statusKon === 'warning').length

  const saveKontrak = async (id) => {
    if (!form.kontrakAkhir) { showToast('Pilih tanggal dulu', 'error'); return }
    try {
      await fetch(APPS_SCRIPT_URL, {
        method: 'POST', mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'save_kontrak', nik: id, kontrakAkhir: form.kontrakAkhir }),
      })
      showToast('Kontrak tersimpan')
      refreshData()
      setEdit(null)
    } catch (err) {
      showToast('Gagal: ' + err.message, 'error')
    }
  }

  const exportExcel = () => {
    const rows = data.map((d, i) => ({ No: i + 1, Nama: d.nama, Area: d.area, Jabatan: d.jabatan, 'Kontrak Akhir': d.kontrakAkhir || '-', Status: d.statusKon }))
    const ws = XLSX.utils.json_to_sheet(rows); const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Kontrak'); XLSX.writeFile(wb, 'kontrak_karyawan.xlsx')
    showToast('Download Excel berhasil')
  }

  const exportPDF = () => {
    const doc = new jsPDF()
    doc.text('Status Kontrak Karyawan', 14, 15)
    const rows = data.map((d, i) => [i + 1, d.nama, d.area, d.jabatan, d.kontrakAkhir || '-', d.statusKon])
    doc.autoTable({ head: [['No', 'Nama', 'Area', 'Jabatan', 'Kontrak Akhir', 'Status']], body: rows, styles: { fontSize: 7 }, headStyles: { fillColor: [59, 130, 246] } })
    doc.save('kontrak_karyawan.pdf')
    showToast('Download PDF berhasil')
  }

  const statusLabel = { expired: 'Expired', warning: '< 30 Hari', aman: 'Aman', kosong: 'Belum Diisi' }
  const statusColor = { expired: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300', warning: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300', aman: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300', kosong: 'bg-gray-100 text-gray-500 dark:bg-gray-700' }

  if (loading) return <SkeletonTable />

  return (
    <>
      <header className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">Kontrak Karyawan</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {expiredCount > 0 && <span className="text-red-600 font-medium">{expiredCount} expired</span>}
            {expiredCount > 0 && warningCount > 0 && <span> · </span>}
            {warningCount > 0 && <span className="text-yellow-600 font-medium">{warningCount} akan habis</span>}
            {!expiredCount && !warningCount && <span>Semua kontrak aman</span>}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select value={areaFilter} onChange={(e) => setAreaFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-gray-700">
            {daftarArea.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-gray-700">
            <option value="semua">Semua</option>
            <option value="expired">Expired</option>
            <option value="warning">Akan Habis</option>
            <option value="aman">Aman</option>
          </select>
          <button onClick={exportExcel}
            className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700">Excel</button>
          <button onClick={exportPDF}
            className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700">PDF</button>
        </div>
      </header>

      {expiredCount > 0 && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300">
          ⚠️ {expiredCount} karyawan dengan kontrak expired! Segera perpanjang kontrak.
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b bg-gray-50 dark:bg-gray-800/50">
                <th className="p-3">Nama</th>
                <th className="p-3">Area</th>
                <th className="p-3">Jabatan</th>
                <th className="p-3">Kontrak Akhir</th>
                <th className="p-3">Sisa Hari</th>
                <th className="p-3">Status</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {data.map((d, i) => (
                <tr key={i} className="border-b last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="p-3 font-medium text-gray-800 dark:text-white">{d.nama}</td>
                  <td className="p-3 text-gray-600">{d.area}</td>
                  <td className="p-3 text-gray-600">{d.jabatan}</td>
                  <td className="p-3">
                    {edit === d.id ? (
                      <input type="date" value={form.kontrakAkhir} onChange={(e) => setForm({ kontrakAkhir: e.target.value })}
                        className="w-32 px-2 py-1 border rounded text-sm bg-white dark:bg-gray-700" />
                    ) : (
                      <span>{d.kontrakAkhir || '-'}</span>
                    )}
                  </td>
                  <td className="p-3">
                    {d.sisaHari !== null ? (
                      <span className={d.sisaHari < 0 ? 'text-red-600 font-bold' : d.sisaHari <= 30 ? 'text-yellow-600 font-medium' : 'text-gray-600'}>{d.sisaHari} hari</span>
                    ) : <span className="text-gray-400">-</span>}
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[d.statusKon]}`}>{statusLabel[d.statusKon]}</span>
                  </td>
                  <td className="p-3">
                    {edit === d.id ? (
                      <div className="flex gap-1">
                        <button onClick={() => saveKontrak(d.id)}
                          className="text-xs px-2 py-1 bg-blue-600 text-white rounded">✓</button>
                        <button onClick={() => setEdit(null)}
                          className="text-xs px-2 py-1 border rounded">✕</button>
                      </div>
                    ) : (
                      <button onClick={() => { setEdit(d.id); setForm({ kontrakAkhir: d.kontrakAkhir || '' }) }}
                        className="text-xs px-2 py-1 text-blue-600 hover:bg-blue-50 rounded">Atur</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
