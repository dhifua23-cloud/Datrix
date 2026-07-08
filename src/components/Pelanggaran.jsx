import { parseDuration, formatDuration } from '../services/utils'

export default function Pelanggaran({ data }) {
  const today = new Date().toISOString().slice(0, 10)
  const todayData = data.filter((d) => d.Tanggal?.startsWith(today))
  const telat = todayData.filter((d) => parseDuration(d['Telat (Menit)']) > 0)
  const pulangCepat = todayData.filter((d) => parseDuration(d['Pulang Cepat (Menit)']) > 0)

  return (
    <div className="bg-white rounded-xl shadow p-5">
      <h2 className="text-lg font-semibold mb-3">Pelanggaran Hari Ini</h2>

      <div className="space-y-4">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-2">Telat ({telat.length})</p>
          {telat.length === 0 ? (
            <p className="text-green-600 text-sm">Tidak ada pelanggaran</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b">
                    <th className="pb-2">Nama</th>
                    <th className="pb-2">Telat</th>
                    <th className="pb-2">Jam Masuk</th>
                  </tr>
                </thead>
                <tbody>
                  {telat.map((d, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="py-2">{d.Nama}</td>
                      <td className="py-2 text-red-600">{formatDuration(parseDuration(d['Telat (Menit)']))}</td>
                      <td className="py-2">{d['Jam Masuk']}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div>
          <p className="text-sm font-medium text-gray-500 mb-2">Pulang Cepat ({pulangCepat.length})</p>
          {pulangCepat.length === 0 ? (
            <p className="text-green-600 text-sm">Tidak ada pelanggaran</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b">
                    <th className="pb-2">Nama</th>
                    <th className="pb-2">Pulang Cepat</th>
                    <th className="pb-2">Jam Pulang</th>
                  </tr>
                </thead>
                <tbody>
                  {pulangCepat.map((d, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="py-2">{d.Nama}</td>
                      <td className="py-2 text-red-600">{formatDuration(parseDuration(d['Pulang Cepat (Menit)']))}</td>
                      <td className="py-2">{d['Jam Pulang']}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
