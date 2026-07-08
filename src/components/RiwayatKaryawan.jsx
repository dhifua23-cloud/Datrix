import { useMemo } from 'react'

export default function RiwayatKaryawan({ absensi, karyawan, nama, onClose }) {
  const dataKaryawan = karyawan.find((k) => k.Nama === nama)
  const riwayat = useMemo(() => {
    return absensi
      .filter((d) => d.Nama === nama)
      .sort((a, b) => (b.Tanggal || '').localeCompare(a.Tanggal || ''))
  }, [absensi, nama])

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-5 border-b flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">{nama}</h2>
            <p className="text-sm text-gray-500">{dataKaryawan?.Jabatan} &middot; {dataKaryawan?.Area}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
        </div>

        <div className="p-5">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="pb-2">Tanggal</th>
                <th className="pb-2">Jam Masuk</th>
                <th className="pb-2">Jam Pulang</th>
                <th className="pb-2">Status</th>
                <th className="pb-2">Telat</th>
                <th className="pb-2">Pulang Cepat</th>
              </tr>
            </thead>
            <tbody>
              {riwayat.map((d, i) => (
                <tr key={i} className="border-b last:border-0">
                  <td className="py-2">{d.Tanggal?.slice(0, 10)}</td>
                  <td className="py-2">{d['Jam Masuk'] || '-'}</td>
                  <td className="py-2">{d['Jam Pulang'] || '-'}</td>
                  <td className="py-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      d['Status Kehadiran'] === 'Hadir' ? 'bg-green-100 text-green-700' :
                      d['Status Kehadiran'] === 'Telat' ? 'bg-red-100 text-red-700' :
                      d['Status Kehadiran'] === 'Izin' ? 'bg-yellow-100 text-yellow-700' :
                      d['Status Kehadiran'] === 'Sakit' ? 'bg-orange-100 text-orange-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {d['Status Kehadiran'] || '-'}
                    </span>
                  </td>
                  <td className="py-2 text-red-600">{d['Telat (Menit)'] || '-'}</td>
                  <td className="py-2 text-orange-600">{d['Pulang Cepat (Menit)'] || '-'}</td>
                </tr>
              ))}
              {riwayat.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-4 text-center text-gray-400">Belum ada data absensi</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
