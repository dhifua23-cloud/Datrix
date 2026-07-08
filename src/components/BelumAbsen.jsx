export default function BelumAbsen({ absensi, karyawan, onLihat }) {
  const today = new Date().toISOString().slice(0, 10)
  const todayData = absensi.filter((d) => d.Tanggal?.startsWith(today))

  const nikHadirHariIni = new Set(todayData.map((d) => d.NIK).filter(Boolean))

  const belumAbsen = karyawan.filter((k) => {
    const nik = k['NIK'] || k['Employee Id'] || ''
    return nik && !nikHadirHariIni.has(nik)
  })

  return (
    <div className="bg-white rounded-xl shadow p-5">
      <h2 className="text-lg font-semibold mb-3">Belum Absen Hari Ini ({belumAbsen.length})</h2>
      {belumAbsen.length === 0 ? (
        <p className="text-green-600 text-sm">Semua sudah absen hari ini</p>
      ) : (
        <div className="overflow-x-auto max-h-64 overflow-y-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="pb-2">Nama</th>
                <th className="pb-2">Area</th>
                <th className="pb-2">Jabatan</th>
              </tr>
            </thead>
            <tbody>
              {belumAbsen.map((d, i) => (
                <tr key={i} className="border-b last:border-0">
                  <td className="py-2">
                    <button
                      onClick={() => onLihat?.(d.Nama)}
                      className="text-red-600 font-medium hover:underline text-left"
                    >
                      {d.Nama}
                    </button>
                  </td>
                  <td className="py-2">{d.Area}</td>
                  <td className="py-2">{d.Jabatan}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
