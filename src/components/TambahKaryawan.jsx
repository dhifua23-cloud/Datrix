import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { APPS_SCRIPT_URL } from '../config'

export default function TambahKaryawan({ onClose }) {
  const { showToast } = useApp()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    employeeId: '',
    name: '',
    email: '',
    area: '',
    position: '',
    role: 'Karyawan',
    password: '',
    birthInfo: '',
    domicile: '',
    ktpAddress: '',
    education: '',
    ktpNumber: '',
    maritalStatus: '',
    kkNumber: '',
    bpjsKes: '',
    bpjsKet: '',
    bankName: '',
    bankAccountNumber: '',
    employeeIn: new Date().toISOString().slice(0, 10),
  })

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.employeeId || !form.name || !form.password) {
      showToast('Employee ID, Nama, dan Password wajib diisi', 'error')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'add_employee', ...form }),
      })
      showToast('Karyawan berhasil ditambahkan!')
      onClose()
    } catch (err) {
      showToast('Gagal menambahkan: ' + err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white">Tambah Karyawan</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Employee ID *" name="employeeId" value={form.employeeId} onChange={handleChange} />
            <Field label="Nama *" name="name" value={form.name} onChange={handleChange} />
            <Field label="Email" name="email" value={form.email} onChange={handleChange} type="email" />
            <Field label="Area" name="area" value={form.area} onChange={handleChange} />
            <Field label="Jabatan" name="position" value={form.position} onChange={handleChange} />
            <Field label="Role" name="role" value={form.role} onChange={handleChange} />
            <Field label="Password *" name="password" value={form.password} onChange={handleChange} type="password" />
            <Field label="Tempat, Tanggal Lahir" name="birthInfo" value={form.birthInfo} onChange={handleChange} />
            <Field label="Pendidikan" name="education" value={form.education} onChange={handleChange} />
            <Field label="Status Perkawinan" name="maritalStatus" value={form.maritalStatus} onChange={handleChange} />
            <Field label="Nama Bank" name="bankName" value={form.bankName} onChange={handleChange} />
            <Field label="No. Rekening" name="bankAccountNumber" value={form.bankAccountNumber} onChange={handleChange} />
            <Field label="Employee In" name="employeeIn" value={form.employeeIn} onChange={handleChange} type="date" />
            <Field label="NIK KTP" name="ktpNumber" value={form.ktpNumber} onChange={handleChange} />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Alamat Domisili</label>
            <textarea name="domicile" value={form.domicile} onChange={handleChange} rows={2}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-white placeholder-gray-400" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Alamat KTP</label>
            <textarea name="ktpAddress" value={form.ktpAddress} onChange={handleChange} rows={2}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-white placeholder-gray-400" />
          </div>

          <div className="flex gap-2 pt-2">
            <button type="submit" disabled={loading}
              className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-all">
              {loading ? 'Menyimpan...' : 'Simpan'}
            </button>
            <button type="button" onClick={onClose}
              className="px-5 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-all">
              Batal
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Field({ label, name, value, onChange, type = 'text' }) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
      <input type={type} name={name} value={value} onChange={onChange}
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-white placeholder-gray-400" />
    </div>
  )
}
