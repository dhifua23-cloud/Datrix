import { useMemo } from 'react'

export default function StatusHariIni({ absensi, title, filterFn, warna, onLihat }) {
  const today = new Date().toISOString().slice(0, 10)
  const todayData = absensi.filter((d) => d.Tanggal?.startsWith(today))
  const data = todayData.filter(filterFn)

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-5">
      <h2 className="text-lg font-semibold mb-3 text-gray-800 dark:text-white">{title} ({data.length})</h2>
      {data.length === 0 ? (
        <p className="text-gray-400 text-sm">Tidak ada</p>
      ) : (
        <div className="overflow-x-auto max-h-52 overflow-y-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                <th className="pb-2">Nama</th>
                <th className="pb-2">Area</th>
                <th className="pb-2">Jam</th>
              </tr>
            </thead>
            <tbody>
              {data.map((d, i) => (
                <tr key={i} className="border-b border-gray-100 dark:border-gray-700 last:border-0">
                  <td className="py-2">
                    <button onClick={() => onLihat?.(d.Nama)}
                      className={`font-medium hover:underline text-left ${warna || 'text-gray-800 dark:text-white'}`}>
                      {d.Nama}
                    </button>
                  </td>
                  <td className="py-2 text-gray-600 dark:text-gray-400">{d.Area}</td>
                  <td className="py-2 text-gray-800 dark:text-white">{d['Jam Masuk'] || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
