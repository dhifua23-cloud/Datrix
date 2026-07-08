import { useState, useMemo } from 'react'
import { useApp } from '../context/AppContext'
import { SkeletonCard } from '../components/Skeleton'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const bulanNama = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']

export default function RekapTahunanPage() {
  const { absensi, gaji, karyawan, showToast } = useApp()
  const [tahun, setTahun] = useState(new Date().getFullYear())
  const [areaFilter, setAreaFilter] = useState('Semua Area')
  const [tab, setTab] = useState('absensi')

  const daftarArea = useMemo(() => {
    const areas = new Set([...absensi.map((d) => d.Area), ...karyawan.map((k) => k.Area)].filter(Boolean))
    return ['Semua Area', ...areas]
  }, [absensi, karyawan])

  // ========== ABSENSI ==========
  const dataBulanan = useMemo(() => {
    const bulan = Array.from({ length: 12 }, (_, i) => ({
      bulan: i, nama: bulanNama[i], Hadir: 0, Telat: 0, Izin: 0, Sakit: 0, Alpha: 0, total: 0,
    }))
    absensi.forEach((d) => {
      if (!d.Tanggal) return
      const tgl = new Date(d.Tanggal)
      if (tgl.getFullYear() !== tahun) return
      if (areaFilter !== 'Semua Area' && d.Area !== areaFilter) return
      const b = tgl.getMonth()
      if (!bulan[b]) return
      const s = d['Status Kehadiran']
      if (s === 'Hadir') bulan[b].Hadir++
      else if (s === 'Telat') bulan[b].Telat++
      else if (s === 'Izin') bulan[b].Izin++
      else if (s === 'Sakit') bulan[b].Sakit++
      else bulan[b].Alpha++
      bulan[b].total++
    })
    return bulan
  }, [absensi, tahun, areaFilter])

  const totalAbsen = useMemo(() => {
    const t = { Hadir: 0, Telat: 0, Izin: 0, Sakit: 0, Alpha: 0, total: 0 }
    dataBulanan.forEach((b) => { t.Hadir += b.Hadir; t.Telat += b.Telat; t.Izin += b.Izin; t.Sakit += b.Sakit; t.Alpha += b.Alpha; t.total += b.total })
    return t
  }, [dataBulanan])

  // ========== GAJI ==========
  const gajiPerBulan = useMemo(() => {
    const gajiMap = {}
    gaji.forEach((g) => {
      const namaKey = (g['Nama'] || '').trim().toLowerCase()
      gajiMap[namaKey] = parseInt(g['Gaji Pokok']) || 0
    })

    const bulan = Array.from({ length: 12 }, (_, i) => ({
      bulan: i, nama: bulanNama[i], totalGaji: 0, totalLembur: 0, totalDenda: 0, totalInsentif: 0, totalNet: 0, count: 0,
    }))

    absensi.forEach((d) => {
      if (!d.Tanggal) return
      const tgl = new Date(d.Tanggal)
      if (tgl.getFullYear() !== tahun) return
      if (areaFilter !== 'Semua Area' && d.Area !== areaFilter) return
      const b = tgl.getMonth()
      if (!bulan[b]) return
    })

    karyawan.forEach((k) => {
      if (areaFilter !== 'Semua Area' && k.Area !== areaFilter) return
      const namaKey = (k.Nama || '').trim().toLowerCase()
      const gajiPokok = gajiMap[namaKey] || 0
      const gajiHarian = Math.round(gajiPokok / 30)
      const hadirBulan = Array(12).fill(0)
      const lemburBulan = Array(12).fill(0)

      absensi.forEach((d) => {
        if (!d.Tanggal) return
        if ((d.Nama || '').trim().toLowerCase() !== namaKey) return
        const tgl = new Date(d.Tanggal)
        if (tgl.getFullYear() !== tahun) return
        const b = tgl.getMonth()
        if (d['Status Kehadiran'] === 'Hadir' || d['Status Kehadiran'] === 'Telat') hadirBulan[b]++
        const lm = d['Jam Mulai Lembur'] || ''; const lk = d['Jam Selesai Lembur'] || ''
        if (lm && lk) {
          const [hj, hm] = lm.split(':').map(Number); const [kj, km] = lk.split(':').map(Number)
          const dur = ((kj * 60 + km) - (hj * 60 + hm)) / 60
          if (dur > 0) lemburBulan[b] += dur
        }
      })

      hadirBulan.forEach((h, b) => {
        if (h === 0) return
        bulan[b].totalGaji += gajiHarian * h
        bulan[b].totalLembur += Math.round(lemburBulan[b] * 20000)
        bulan[b].count++
      })
    })

    bulan.forEach((b) => {
      b.totalNet = b.totalGaji + b.totalLembur
    })

    return bulan
  }, [absensi, karyawan, gaji, tahun, areaFilter])

  const totalGajiThn = useMemo(() => {
    const t = { totalGaji: 0, totalLembur: 0, totalNet: 0 }
    gajiPerBulan.forEach((b) => { t.totalGaji += b.totalGaji; t.totalLembur += b.totalLembur; t.totalNet += b.totalNet })
    return t
  }, [gajiPerBulan])

  const exportExcel = () => {
    if (tab === 'absensi') {
      const data = [...dataBulanan.map((b) => ({ Bulan: b.nama, Hadir: b.Hadir, Telat: b.Telat, Izin: b.Izin, Sakit: b.Sakit, Alpha: b.Alpha, Total: b.total })), { Bulan: 'TOTAL', Hadir: totalAbsen.Hadir, Telat: totalAbsen.Telat, Izin: totalAbsen.Izin, Sakit: totalAbsen.Sakit, Alpha: totalAbsen.Alpha, Total: totalAbsen.total }]
      const ws = XLSX.utils.json_to_sheet(data); const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Absensi'); XLSX.writeFile(wb, `absensi_tahunan_${tahun}.xlsx`)
    } else {
      const data = [...gajiPerBulan.map((b) => ({ Bulan: b.nama, 'Total Gaji': b.totalGaji, 'Total Lembur': b.totalLembur, 'Net': b.totalNet })), { Bulan: 'TOTAL', 'Total Gaji': totalGajiThn.totalGaji, 'Total Lembur': totalGajiThn.totalLembur, 'Net': totalGajiThn.totalNet }]
      const ws = XLSX.utils.json_to_sheet(data); const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Gaji'); XLSX.writeFile(wb, `gaji_tahunan_${tahun}.xlsx`)
    }
    showToast('Download Excel berhasil')
  }

  const exportPDF = () => {
    const doc = new jsPDF()
    doc.text(`${tab === 'absensi' ? 'Absensi' : 'Gaji'} Tahunan ${tahun}`, 14, 15)
    const data = tab === 'absensi' ? dataBulanan : gajiPerBulan
    const headers = tab === 'absensi'
      ? [['Bulan', 'Hadir', 'Telat', 'Izin', 'Sakit', 'Alpha', 'Total']]
      : [['Bulan', 'Total Gaji', 'Total Lembur', 'Net']]
    const rows = data.map((b) => tab === 'absensi'
      ? [b.nama, b.Hadir, b.Telat, b.Izin, b.Sakit, b.Alpha, b.total]
      : [b.nama, b.totalGaji, b.totalLembur, b.totalNet])
    rows.push(tab === 'absensi'
      ? ['TOTAL', totalAbsen.Hadir, totalAbsen.Telat, totalAbsen.Izin, totalAbsen.Sakit, totalAbsen.Alpha, totalAbsen.total]
      : ['TOTAL', totalGajiThn.totalGaji, totalGajiThn.totalLembur, totalGajiThn.totalNet])
    doc.autoTable({ head: headers, body: rows, styles: { fontSize: 8 }, headStyles: { fillColor: [59, 130, 246] } })
    doc.save(`${tab}_tahunan_${tahun}.pdf`)
    showToast('Download PDF berhasil')
  }

  if (!absensi.length) return <div className="grid grid-cols-2 md:grid-cols-3 gap-4">{[1,2,3,4,5,6].map((i) => <SkeletonCard key={i} />)}</div>

  return (
    <>
      <header className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">Rekap Tahunan</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Ringkasan {tab === 'absensi' ? 'kehadiran' : 'gaji'} 12 bulan</p>
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

      {/* Tab */}
      <div className="flex gap-1 mb-6">
        <button onClick={() => setTab('absensi')}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'absensi' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border dark:border-gray-700'}`}>
          Absensi
        </button>
        <button onClick={() => setTab('gaji')}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'gaji' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border dark:border-gray-700'}`}>
          Payroll
        </button>
      </div>

      {tab === 'absensi' ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
            {[
              { label: 'Hadir', value: totalAbsen.Hadir, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20' },
              { label: 'Telat', value: totalAbsen.Telat, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20' },
              { label: 'Izin', value: totalAbsen.Izin, color: 'text-yellow-600', bg: 'bg-yellow-50 dark:bg-yellow-900/20' },
              { label: 'Sakit', value: totalAbsen.Sakit, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/20' },
              { label: 'Alpha', value: totalAbsen.Alpha, color: 'text-gray-600', bg: 'bg-gray-50 dark:bg-gray-800' },
            ].map((item) => (
              <div key={item.label} className={`${item.bg} rounded-xl p-4 text-center transition-colors`}>
                <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{item.label}</p>
              </div>
            ))}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-5 transition-colors">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={dataBulanan}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="nama" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="Hadir" fill="#22c55e" />
                <Bar dataKey="Telat" fill="#ef4444" />
                <Bar dataKey="Izin" fill="#eab308" />
                <Bar dataKey="Sakit" fill="#f97316" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden mt-6 transition-colors">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b bg-gray-50 dark:bg-gray-800/50">
                  <th className="p-3">Bulan</th>
                  <th className="p-3 text-center">Hadir</th>
                  <th className="p-3 text-center">Telat</th>
                  <th className="p-3 text-center">Izin</th>
                  <th className="p-3 text-center">Sakit</th>
                  <th className="p-3 text-center">Alpha</th>
                  <th className="p-3 text-center">Total</th>
                </tr>
              </thead>
              <tbody>
                {dataBulanan.map((b) => (
                  <tr key={b.bulan} className="border-b last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="p-3 font-medium">{b.nama}</td>
                    <td className="p-3 text-center text-green-600">{b.Hadir}</td>
                    <td className="p-3 text-center text-red-600">{b.Telat}</td>
                    <td className="p-3 text-center text-yellow-600">{b.Izin}</td>
                    <td className="p-3 text-center text-orange-600">{b.Sakit}</td>
                    <td className="p-3 text-center text-gray-500">{b.Alpha}</td>
                    <td className="p-3 text-center font-medium">{b.total}</td>
                  </tr>
                ))}
                <tr className="bg-gray-50 dark:bg-gray-700/50 font-semibold">
                  <td className="p-3">TOTAL</td>
                  <td className="p-3 text-center text-green-600">{totalAbsen.Hadir}</td>
                  <td className="p-3 text-center text-red-600">{totalAbsen.Telat}</td>
                  <td className="p-3 text-center text-yellow-600">{totalAbsen.Izin}</td>
                  <td className="p-3 text-center text-orange-600">{totalAbsen.Sakit}</td>
                  <td className="p-3 text-center text-gray-500">{totalAbsen.Alpha}</td>
                  <td className="p-3 text-center">{totalAbsen.total}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
            {[
              { label: 'Total Gaji', value: totalGajiThn.totalGaji, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
              { label: 'Total Lembur', value: totalGajiThn.totalLembur, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20' },
              { label: 'Total Net', value: totalGajiThn.totalNet, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' },
            ].map((item) => (
              <div key={item.label} className={`${item.bg} rounded-xl p-4 text-center transition-colors`}>
                <p className={`text-2xl font-bold ${item.color}`}>Rp {item.value.toLocaleString('id-ID')}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{item.label}</p>
              </div>
            ))}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-5 transition-colors">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={gajiPerBulan}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="nama" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="totalGaji" fill="#3b82f6" name="Total Gaji" />
                <Bar dataKey="totalLembur" fill="#22c55e" name="Total Lembur" />
                <Bar dataKey="totalNet" fill="#8b5cf6" name="Total Net" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden mt-6 transition-colors">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b bg-gray-50 dark:bg-gray-800/50">
                  <th className="p-3">Bulan</th>
                  <th className="p-3 text-right">Total Gaji</th>
                  <th className="p-3 text-right">Total Lembur</th>
                  <th className="p-3 text-right">Net</th>
                </tr>
              </thead>
              <tbody>
                {gajiPerBulan.map((b) => (
                  <tr key={b.bulan} className="border-b last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="p-3 font-medium">{b.nama}</td>
                    <td className="p-3 text-right">Rp {b.totalGaji.toLocaleString('id-ID')}</td>
                    <td className="p-3 text-right text-green-600">Rp {b.totalLembur.toLocaleString('id-ID')}</td>
                    <td className="p-3 text-right font-semibold">Rp {b.totalNet.toLocaleString('id-ID')}</td>
                  </tr>
                ))}
                <tr className="bg-gray-50 dark:bg-gray-700/50 font-semibold">
                  <td className="p-3">TOTAL</td>
                  <td className="p-3 text-right">Rp {totalGajiThn.totalGaji.toLocaleString('id-ID')}</td>
                  <td className="p-3 text-right text-green-600">Rp {totalGajiThn.totalLembur.toLocaleString('id-ID')}</td>
                  <td className="p-3 text-right">Rp {totalGajiThn.totalNet.toLocaleString('id-ID')}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  )
}
