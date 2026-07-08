import { useState, useMemo } from 'react'
import { useApp } from '../context/AppContext'
import { SkeletonTable } from '../components/Skeleton'
import TambahKaryawan from '../components/TambahKaryawan'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { APPS_SCRIPT_URL } from '../config'

export default function KaryawanPage() {
  const { absensi, karyawan, loading, showToast } = useApp()
  const [cari, setCari] = useState('')
  const [areaFilter, setAreaFilter] = useState('Semua Area')
  const [bulanFilter, setBulanFilter] = useState('Semua')
  const [tahunFilter, setTahunFilter] = useState(new Date().getFullYear())
  const [showTambah, setShowTambah] = useState(false)
  const [detail, setDetail] = useState(null)
  const [editForm, setEditForm] = useState(null)

  const daftarArea = useMemo(() => {
    const areas = new Set(karyawan.map((k) => k.Area).filter(Boolean))
    return ['Semua Area', ...areas]
  }, [karyawan])

  const namaBulan = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

  const filtered = useMemo(() => {
    const activeNik = new Set()
    if (bulanFilter !== 'Semua') {
      absensi.forEach((d) => {
        if (!d.Tanggal) return
        const tgl = new Date(d.Tanggal)
        if (tgl.getMonth() + 1 === parseInt(bulanFilter) && tgl.getFullYear() === tahunFilter) {
          activeNik.add(d.NIK || d.Nama || '')
        }
      })
    }

    return karyawan.filter((k) => {
      if (areaFilter !== 'Semua Area' && k.Area !== areaFilter) return false
      if (bulanFilter !== 'Semua') {
        const nik = k['Employee Id'] || k.Nama || ''
        if (!activeNik.has(nik)) return false
      }
      if (!cari.trim()) return true
      const q = cari.toLowerCase()
      return (k.Nama || '').toLowerCase().includes(q) ||
        (k['Employee Id'] || '').toLowerCase().includes(q) ||
        (k.Area || '').toLowerCase().includes(q) ||
        (k.Jabatan || '').toLowerCase().includes(q)
    })
  }, [karyawan, cari, areaFilter, bulanFilter, tahunFilter, absensi])

  // ========== DETAIL MODAL ==========
  const lihatDetail = (k) => setDetail(k)

  const ModalDetail = () => {
    if (!detail) return null
    const fields = [
      ['Employee ID', detail['Employee Id']],
      ['Nama', detail.Nama],
      ['Email', detail.Email],
      ['Area', detail.Area],
      ['Jabatan', detail.Jabatan],
      ['Role', detail.Role],
      ['Status', detail.Status],
      ['Tempat, Tanggal Lahir', detail['Tempat, Tanggal Lahir']],
      ['Alamat Domisili', detail['Alamat Domisili']],
      ['Alamat KTP', detail['Alamat KTP']],
      ['Pendidikan', detail.Pendidikan],
      ['NIK KTP', detail['NIK KTP']],
      ['Status Perkawinan', detail['Status Perkawinan']],
      ['NO KK', detail['NO KK']],
      ['BPJS Kesehatan', detail['BPJS KESEHATAN']],
      ['BPJS Ketenagakerjaan', detail['BPJS KETENAGAKERJAAN']],
      ['Nama Bank', detail['NAMA BANK']],
      ['Nomor Rekening', detail['Nomor Rekening']],
    ]
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setDetail(null)}>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
          <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-800 dark:text-white">Detail Karyawan</h2>
            <button onClick={() => setDetail(null)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
          </div>
          <div className="p-5 space-y-3 text-sm">
            {fields.map(([label, value]) => (
              <div key={label} className="flex justify-between border-b border-gray-100 dark:border-gray-700 pb-2">
                <span className="text-gray-500 dark:text-gray-400">{label}</span>
                <span className="text-gray-800 dark:text-white font-medium text-right">{value || '-'}</span>
              </div>
            ))}
          </div>
          <div className="px-5 pb-5">
            <button onClick={() => { setDetail(null); bukaEdit(detail) }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Edit Data</button>
          </div>
        </div>
      </div>
    )
  }

  // ========== EDIT MODAL ==========
  const bukaEdit = (k) => {
    setEditForm({
      employeeId: k['Employee Id'] || '',
      name: k.Nama || '',
      email: k.Email || '',
      area: k.Area || '',
      position: k.Jabatan || '',
      role: k.Role || 'Karyawan',
      password: k.Password || '',
      birthInfo: k['Tempat, Tanggal Lahir'] || '',
      domicile: k['Alamat Domisili'] || '',
      ktpAddress: k['Alamat KTP'] || '',
      education: k.Pendidikan || '',
      ktpNumber: k['NIK KTP'] || '',
      maritalStatus: k['Status Perkawinan'] || '',
      kkNumber: k['NO KK'] || '',
      bpjsKes: k['BPJS KESEHATAN'] || '',
      bpjsKet: k['BPJS KETENAGAKERJAAN'] || '',
      bankName: k['NAMA BANK'] || '',
      bankAccountNumber: k['Nomor Rekening'] || '',
      employeeIn: k['Employee In'] || '',
      employeeOut: k['Employee Out'] || '',
    })
  }

  const simpanEdit = async () => {
    if (!editForm) return
    try {
      await fetch(APPS_SCRIPT_URL, {
        method: 'POST', mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'update_profile', nik: editForm.employeeId, ...editForm }),
      })
      showToast('Data berhasil diupdate')
      window.location.reload()
    } catch (err) {
      showToast('Gagal: ' + err.message, 'error')
    }
  }

  const EditModal = () => {
    if (!editForm) return null
    const set = (field) => (e) => setEditForm({ ...editForm, [field]: e.target.value })
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setEditForm(null)}>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
          <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-800 dark:text-white">Edit Karyawan</h2>
            <button onClick={() => setEditForm(null)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
          </div>
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                ['employeeId', 'Employee ID'], ['name', 'Nama'], ['email', 'Email'],
                ['area', 'Area'], ['position', 'Jabatan'], ['role', 'Role'],
                ['password', 'Password'], ['birthInfo', 'Tempat, Tanggal Lahir'],
                ['education', 'Pendidikan'], ['maritalStatus', 'Status Perkawinan'],
                ['bankName', 'Nama Bank'], ['bankAccountNumber', 'No. Rekening'],
                ['ktpNumber', 'NIK KTP'], ['kkNumber', 'NO KK'],
                ['bpjsKes', 'BPJS Kesehatan'], ['bpjsKet', 'BPJS Ketenagakerjaan'],
                ['employeeIn', 'Employee In'], ['employeeOut', 'Employee Out'],
              ].map(([field, label]) => (
                <div key={field}>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
                  <input type={field === 'employeeIn' || field === 'employeeOut' ? 'date' : 'text'} value={editForm[field] || ''} onChange={set(field)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-white mt-1" />
                </div>
              ))}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Alamat Domisili</label>
              <textarea rows={2} value={editForm.domicile} onChange={set('domicile')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-white mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Alamat KTP</label>
              <textarea rows={2} value={editForm.ktpAddress} onChange={set('ktpAddress')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-white mt-1" />
            </div>
            <div className="flex gap-2">
              <button onClick={simpanEdit}
                className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Simpan</button>
              <button onClick={() => setEditForm(null)}
                className="px-5 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700">Batal</button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ========== RESIGN ==========
  const resignKaryawan = async (k) => {
    if (!confirm(`Resign karyawan ${k.Nama}?`)) return
    const today = new Date().toISOString().slice(0, 10)
    try {
      await fetch(APPS_SCRIPT_URL, {
        method: 'POST', mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'resign_employee',
          nik: k['Employee Id'],
          nama: k.Nama,
          employeeOut: today,
        }),
      })
      showToast('Karyawan resign')
      window.location.reload()
    } catch (err) {
      showToast('Gagal: ' + err.message, 'error')
    }
  }

  // ========== EXPORT ==========
  const exportExcel = () => {
    const data = filtered.map((k) => ({
      'Employee ID': k['Employee Id'], Nama: k.Nama, Email: k.Email, Area: k.Area,
      Jabatan: k.Jabatan, Role: k.Role, Status: k.Status, 'Tempat Lahir': k['Tempat, Tanggal Lahir'],
      Pendidikan: k.Pendidikan, 'NIK KTP': k['NIK KTP'], 'Status Kawin': k['Status Perkawinan'],
      'Nama Bank': k['NAMA BANK'], 'No Rekening': k['Nomor Rekening'],
    }))
    const periode = bulanFilter !== 'Semua' ? `_${namaBulan[parseInt(bulanFilter)]}_${tahunFilter}` : ''
    const ws = XLSX.utils.json_to_sheet(data); const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Karyawan')
    XLSX.writeFile(wb, `karyawan${periode}.xlsx`)
    showToast('Download Excel berhasil')
  }

  const exportPDF = () => {
    const doc = new jsPDF('landscape')
    doc.text('Data Karyawan', 14, 15)
    const headers = [['ID', 'Nama', 'Email', 'Area', 'Jabatan', 'Role', 'Status']]
    const rows = filtered.map((k) => [k['Employee Id'], k.Nama, k.Email, k.Area, k.Jabatan, k.Role, k.Status])
    doc.autoTable({ head: headers, body: rows, styles: { fontSize: 7 }, headStyles: { fillColor: [59, 130, 246] } })
    const periode = bulanFilter !== 'Semua' ? `_${namaBulan[parseInt(bulanFilter)]}_${tahunFilter}` : ''
    doc.save(`karyawan${periode}.pdf`)
    showToast('Download PDF berhasil')
  }

  if (loading) return <SkeletonTable />

  return (
    <>
      <header className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">Karyawan</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Total: {karyawan.length} karyawan</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select value={bulanFilter} onChange={(e) => setBulanFilter(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-white">
            <option value="Semua">Semua Bulan</option>
            {namaBulan.slice(1).map((b, i) => <option key={i + 1} value={i + 1}>{b}</option>)}
          </select>
          {bulanFilter !== 'Semua' && (
            <input type="number" value={tahunFilter} onChange={(e) => setTahunFilter(parseInt(e.target.value) || new Date().getFullYear())}
              className="w-20 px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-white" />
          )}
          <select value={areaFilter} onChange={(e) => setAreaFilter(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-white">
            {daftarArea.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
          <button onClick={() => setShowTambah(true)}
            className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">+ Tambah</button>
          <button onClick={exportExcel}
            className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700">Excel</button>
          <button onClick={exportPDF}
            className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700">PDF</button>
        </div>
      </header>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden transition-colors">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <input type="text" placeholder="Cari nama / NIK / area..." value={cari}
            onChange={(e) => setCari(e.target.value)}
            className="w-full max-w-md px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-white placeholder-gray-400" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <th className="p-3">NIK</th>
                <th className="p-3">Nama</th>
                <th className="p-3">Area</th>
                <th className="p-3">Jabatan</th>
                <th className="p-3">Status</th>
                <th className="p-3">Role</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d, i) => (
                <tr key={i} className="border-b border-gray-100 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <td className="p-3 text-gray-600 dark:text-gray-400">{d['Employee Id'] || '-'}</td>
                  <td className="p-3 font-medium text-gray-800 dark:text-white">
                    <button onClick={() => lihatDetail(d)} className="hover:underline text-left">{d.Nama || '-'}</button>
                  </td>
                  <td className="p-3 text-gray-600 dark:text-gray-400">{d.Area || '-'}</td>
                  <td className="p-3 text-gray-600 dark:text-gray-400">{d.Jabatan || '-'}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      d.Status === 'Active' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'
                    }`}>{d.Status || '-'}</span>
                  </td>
                  <td className="p-3 text-gray-600 dark:text-gray-400">{d.Role || '-'}</td>
                  <td className="p-3">
                    <div className="flex gap-1">
                      <button onClick={() => bukaEdit(d)}
                        className="text-xs px-2 py-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded">Edit</button>
                      {d.Status === 'Active' && (
                        <button onClick={() => resignKaryawan(d)}
                          className="text-xs px-2 py-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded">Resign</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="p-6 text-center text-gray-400 dark:text-gray-500">Karyawan tidak ditemukan</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showTambah && <TambahKaryawan onClose={() => setShowTambah(false)} />}
      {detail && <ModalDetail />}
      {editForm && <EditModal />}
    </>
  )
}
