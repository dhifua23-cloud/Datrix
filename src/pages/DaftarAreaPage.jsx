import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { APPS_SCRIPT_URL } from '../config'
import { SkeletonTable } from '../components/Skeleton'

export default function DaftarAreaPage() {
  const { daftarArea, showToast, refreshData } = useApp()
  const [showForm, setShowForm] = useState(false)
  const [edit, setEdit] = useState(null)
  const [form, setForm] = useState({ nama: '', lat: '', lon: '', radius: '100' })

  const resetForm = () => { setForm({ nama: '', lat: '', lon: '', radius: '100' }); setEdit(null); setShowForm(false) }

  const bukaEdit = (a) => {
    setEdit(a['Nama Area']); setForm({ nama: a['Nama Area'], lat: a['Lat Area'] || '', lon: a['Lon Area'] || '', radius: a['Radius_Meter'] || '100' })
    setShowForm(true)
  }

  const simpan = async () => {
    if (!form.nama) { showToast('Nama area wajib diisi', 'error'); return }
    try {
      await fetch(APPS_SCRIPT_URL, {
        method: 'POST', mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'save_area', ...form }),
      })
      showToast('Area tersimpan')
      resetForm(); refreshData()
    } catch (err) { showToast('Gagal: ' + err.message, 'error') }
  }

  const hapus = async (nama) => {
    if (!confirm(`Hapus area ${nama}?`)) return
    try {
      await fetch(APPS_SCRIPT_URL, {
        method: 'POST', mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'delete_area', nama }),
      })
      showToast('Area dihapus'); refreshData()
    } catch (err) { showToast('Gagal: ' + err.message, 'error') }
  }

  if (!daftarArea.length) return <p className="text-gray-400 text-sm p-8">Memuat data area...</p>

  return (
    <>
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">Daftar Area</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">{daftarArea.length} area</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true) }}
          className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">+ Tambah Area</button>
      </header>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b bg-gray-50 dark:bg-gray-800/50">
                <th className="p-3">Nama Area</th>
                <th className="p-3">Latitude</th>
                <th className="p-3">Longitude</th>
                <th className="p-3 text-center">Radius (m)</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {daftarArea.map((a) => (
                <tr key={a['Nama Area']} className="border-b last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="p-3 font-medium text-gray-800 dark:text-white">{a['Nama Area']}</td>
                  <td className="p-3 text-gray-600 dark:text-gray-400">{a['Lat Area'] || '-'}</td>
                  <td className="p-3 text-gray-600 dark:text-gray-400">{a['Lon Area'] || '-'}</td>
                  <td className="p-3 text-center text-gray-600 dark:text-gray-400">{a['Radius_Meter'] || '-'}</td>
                  <td className="p-3">
                    <button onClick={() => bukaEdit(a)} className="text-xs px-2 py-1 text-blue-600 hover:bg-blue-50 rounded mr-1">Edit</button>
                    <button onClick={() => hapus(a['Nama Area'])} className="text-xs px-2 py-1 text-red-600 hover:bg-red-50 rounded">Hapus</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={resetForm}>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-4 text-gray-800 dark:text-white">{edit ? 'Edit Area' : 'Tambah Area'}</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Nama Area *</label>
                <input type="text" value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-white mt-1" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Latitude</label>
                  <input type="text" value={form.lat} onChange={(e) => setForm({ ...form, lat: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-white mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Longitude</label>
                  <input type="text" value={form.lon} onChange={(e) => setForm({ ...form, lon: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-white mt-1" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Radius (meter)</label>
                <input type="number" value={form.radius} onChange={(e) => setForm({ ...form, radius: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-white mt-1" />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button onClick={simpan} className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">Simpan</button>
              <button onClick={resetForm} className="px-5 py-2 border rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">Batal</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
