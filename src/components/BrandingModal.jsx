import { useState } from 'react'

export default function BrandingModal({ onClose }) {
  const [form, setForm] = useState({
    nama: localStorage.getItem('brand_nama') || 'Datrix',
    tagline: localStorage.getItem('brand_tagline') || 'Digital Attendance & Tracking Information System',
    logo: localStorage.getItem('brand_logo') || 'Dx',
    logoImg: localStorage.getItem('brand_logo_img') || '',
    warna: localStorage.getItem('brand_warna') || '#2563eb',
  })

  const handleFile = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      setForm({ ...form, logoImg: ev.target.result, logo: '' })
    }
    reader.readAsDataURL(file)
  }

  const hapusGambar = () => {
    setForm({ ...form, logoImg: '', logo: 'Dx' })
  }

  const simpan = () => {
    localStorage.setItem('brand_nama', form.nama)
    localStorage.setItem('brand_tagline', form.tagline)
    localStorage.setItem('brand_logo', form.logo || 'Dx')
    if (form.logoImg) localStorage.setItem('brand_logo_img', form.logoImg)
    else localStorage.removeItem('brand_logo_img')
    localStorage.setItem('brand_warna', form.warna)
    window.location.reload()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Custom Branding</h2>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Nama Perusahaan</label>
            <input type="text" value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-white mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Tagline</label>
            <input type="text" value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-white mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Logo</label>
            <div className="flex items-center gap-3 mt-1">
              {form.logoImg ? (
                <img src={form.logoImg} alt="logo" className="w-12 h-12 rounded-lg object-contain border" />
              ) : (
                <div className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-lg" style={{ backgroundColor: form.warna }}>
                  {form.logo || 'Dx'}
                </div>
              )}
              <label className="px-3 py-2 border rounded-lg text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                Upload Gambar
                <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
              </label>
              {form.logoImg && (
                <button onClick={hapusGambar} className="text-xs text-red-500 hover:underline">Hapus</button>
              )}
            </div>
            {!form.logoImg && (
              <input type="text" value={form.logo} onChange={(e) => setForm({ ...form, logo: e.target.value })}
                placeholder="Teks logo (misal: Dx)"
                className="w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-white mt-2" />
            )}
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Warna Utama</label>
            <div className="flex gap-2 mt-1">
              <input type="color" value={form.warna} onChange={(e) => setForm({ ...form, warna: e.target.value })}
                className="w-12 h-10 rounded border cursor-pointer" />
              <input type="text" value={form.warna} onChange={(e) => setForm({ ...form, warna: e.target.value })}
                className="flex-1 px-3 py-2 border rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-white" />
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <button onClick={simpan}
            className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Simpan</button>
          <button onClick={onClose}
            className="px-5 py-2 border rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">Batal</button>
        </div>
      </div>
    </div>
  )
}
