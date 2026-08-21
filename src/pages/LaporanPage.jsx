import { useMemo, useState } from 'react'
import { useApp } from '../context/AppContext'
import { SkeletonTable, SkeletonChart } from '../components/Skeleton'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const bulanPanjang = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

export default function LaporanPage() {
  const { absensi, gaji, karyawan, daftarArea, loading, showToast } = useApp()
  const [bulan, setBulan] = useState(new Date().getMonth())
  const [tahun, setTahun] = useState(new Date().getFullYear())
  const [areaFilter, setAreaFilter] = useState('Semua Area')
  const [tab, setTab] = useState('absensi')

  const daftarAreaOptions = useMemo(() => {
    const areas = new Set()
    absensi.forEach((d) => { if (d.Area) areas.add(d.Area) })
    if (daftarArea) daftarArea.forEach((a) => { if (a['Nama Area']) areas.add(a['Nama Area']) })
    return ['Semua Area', ...areas]
  }, [absensi, daftarArea])

  const filteredAbsensi = useMemo(() => {
    return absensi.filter((d) => {
      if (!d.Tanggal) return false
      const tgl = new Date(d.Tanggal)
      if (tgl.getMonth() !== bulan || tgl.getFullYear() !== tahun) return false
      if (areaFilter !== 'Semua Area' && d.Area !== areaFilter) return false
      return true
    })
  }, [absensi, bulan, tahun, areaFilter])

  // ========== ABSENSI ==========
  const laporan = useMemo(() => {
    const perKaryawan = {}
    filteredAbsensi.forEach((d) => {
      const nik = d.NIK || d.Nama || 'unknown'
      if (!perKaryawan[nik]) {
        perKaryawan[nik] = { NIK: d.NIK, Nama: d.Nama, Hadir: 0, Telat: 0, Izin: 0, Sakit: 0, Cuti: 0, Off: 0, Alpha: 0, Total: 0 }
      }
      const st = (d['Status Kehadiran'] || '').toLowerCase()
      const sh = (d['Shift'] || '').toLowerCase()
      if (sh === 'off') perKaryawan[nik].Off++
      else if (st.includes('cuti')) perKaryawan[nik].Cuti++
      else if (st === 'hadir') perKaryawan[nik].Hadir++
      else if (st === 'telat') perKaryawan[nik].Telat++
      else if (st.includes('sakit')) perKaryawan[nik].Sakit++
      else if (st.includes('izin')) perKaryawan[nik].Izin++
      else perKaryawan[nik].Alpha++
      perKaryawan[nik].Total++
    })

    const ringkasan = { Hadir: 0, Telat: 0, Izin: 0, Sakit: 0, Cuti: 0, Off: 0, Alpha: 0 }
    filteredAbsensi.forEach((d) => {
      const st = (d['Status Kehadiran'] || '').toLowerCase()
      const sh = (d['Shift'] || '').toLowerCase()
      if (sh === 'off') ringkasan.Off++
      else if (st.includes('cuti')) ringkasan.Cuti++
      else if (st === 'hadir') ringkasan.Hadir++
      else if (st === 'telat') ringkasan.Telat++
      else if (st.includes('sakit')) ringkasan.Sakit++
      else if (st.includes('izin')) ringkasan.Izin++
      else ringkasan.Alpha++
    })

    return {
      daftar: Object.values(perKaryawan).sort((a, b) => a.Nama?.localeCompare(b.Nama)),
      ringkasan,
      total: filteredAbsensi.length,
    }
  }, [filteredAbsensi])

  // ========== GAJI ==========
  const gajiBulanan = useMemo(() => {
    const gajiMap = {}
    gaji.forEach((g) => {
      const namaKey = (g['Nama'] || '').trim().toLowerCase()
      gajiMap[namaKey] = parseInt(g['Gaji Pokok']) || 0
    })

    const perKaryawan = {}
    filteredAbsensi.forEach((d) => {
      const nama = (d.Nama || '').trim().toLowerCase()
      if (!perKaryawan[nama]) {
        perKaryawan[nama] = { Nama: d.Nama, hadir: 0, lemburJam: 0 }
      }
      if (d['Status Kehadiran'] === 'Hadir' || d['Status Kehadiran'] === 'Telat') {
        perKaryawan[nama].hadir++
      }
      const lm = d['Jam Mulai Lembur'] || ''; const lk = d['Jam Selesai Lembur'] || ''
      if (lm && lk) {
        const [hj, hm] = lm.split(':').map(Number); const [kj, km] = lk.split(':').map(Number)
        const dur = ((kj * 60 + km) - (hj * 60 + hm)) / 60
        if (dur > 0) perKaryawan[nama].lemburJam += dur
      }
    })

    const filteredKaryawan = karyawan.filter((k) => {
      if (areaFilter !== 'Semua Area' && k.Area !== areaFilter) return false
      return k.Nama && k.Nama.trim()
    })

    let totalGaji = 0, totalLembur = 0, totalNet = 0
    const daftar = filteredKaryawan.map((k) => {
      const namaKey = (k.Nama || '').trim().toLowerCase()
      const d = perKaryawan[namaKey] || { hadir: 0, lemburJam: 0 }
      const gajiPokok = gajiMap[namaKey] || 0
      const gajiHarian = Math.round(gajiPokok / 30)
      const totalG = gajiHarian * d.hadir
      const totalL = Math.round(d.lemburJam * 20000)
      const net = totalG + totalL
      totalGaji += totalG; totalLembur += totalL; totalNet += net
      return { Nama: k.Nama, GajiPokok: gajiPokok, GajiHarian: gajiHarian, Hadir: d.hadir, TotalGaji: totalG, JamLembur: Math.round(d.lemburJam * 10) / 10, TotalLembur: totalL, Net: net }
    })

    return { daftar, totalGaji, totalLembur, totalNet }
  }, [filteredAbsensi, karyawan, gaji, areaFilter])

  const exportExcel = () => {
    if (tab === 'absensi') {
      const data = laporan.daftar.map((d) => ({ Nama: d.Nama, Hadir: d.Hadir, Telat: d.Telat, Izin: d.Izin, Sakit: d.Sakit, Cuti: d.Cuti, Off: d.Off, Alpha: d.Alpha, Total: d.Total }))
      const ws = XLSX.utils.json_to_sheet(data); const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Absensi'); XLSX.writeFile(wb, `absensi_${bulanPanjang[bulan]}_${tahun}.xlsx`)
    } else {
      const data = gajiBulanan.daftar.map((d) => ({ Nama: d.Nama, 'Gaji Pokok': d.GajiPokok, Harian: d.GajiHarian, Hadir: d.Hadir, 'Total Gaji': d.TotalGaji, 'Jam Lembur': d.JamLembur, 'Total Lembur': d.TotalLembur, Net: d.Net }))
      const ws = XLSX.utils.json_to_sheet(data); const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Gaji'); XLSX.writeFile(wb, `gaji_${bulanPanjang[bulan]}_${tahun}.xlsx`)
    }
    showToast('Download Excel berhasil')
  }

  const exportPDF = () => {
    const doc = new jsPDF('landscape')
    doc.text(`Laporan ${tab === 'absensi' ? 'Absensi' : 'Gaji'} ${bulanPanjang[bulan]} ${tahun}`, 14, 15)
    if (tab === 'absensi') {
      const headers = [['Nama', 'Hadir', 'Telat', 'Izin', 'Sakit', 'Cuti', 'Off', 'Alpha', 'Total']]
      const rows = laporan.daftar.map((d) => [d.Nama, d.Hadir, d.Telat, d.Izin, d.Sakit, d.Cuti, d.Off, d.Alpha, d.Total])
      doc.autoTable({ head: headers, body: rows, styles: { fontSize: 7 }, headStyles: { fillColor: [59, 130, 246] } })
    } else {
      const headers = [['Nama', 'Gaji Pokok', 'Harian', 'Hadir', 'Total Gaji', 'Jam Lembur', 'Total Lembur', 'Net']]
      const rows = gajiBulanan.daftar.map((d) => [d.Nama, d.GajiPokok, d.GajiHarian, d.Hadir, d.TotalGaji, d.JamLembur, d.TotalLembur, d.Net])
      doc.autoTable({ head: headers, body: rows, styles: { fontSize: 7 }, headStyles: { fillColor: [59, 130, 246] } })
    }
    doc.save(`${tab}_${bulanPanjang[bulan]}_${tahun}.pdf`)
    showToast('Download PDF berhasil')
  }

  if (loading) return <><SkeletonChart /><div className="mt-6"><SkeletonTable /></div></>

  return (
    <>
      <header className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">Laporan Bulanan</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">{bulanPanjang[bulan]} {tahun}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select value={areaFilter} onChange={(e) => setAreaFilter(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-white">
            {daftarAreaOptions.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
          <button onClick={() => { if (bulan === 0) { setBulan(11); setTahun(tahun - 1) } else setBulan(bulan - 1) }}
            className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">&lt;</button>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-32 text-center">{bulanPanjang[bulan]} {tahun}</span>
          <button onClick={() => { if (bulan === 11) { setBulan(0); setTahun(tahun + 1) } else setBulan(bulan + 1) }}
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
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
            {[
              { label: 'Hadir', value: laporan.ringkasan.Hadir, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20' },
              { label: 'Telat', value: laporan.ringkasan.Telat, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20' },
              { label: 'Izin', value: laporan.ringkasan.Izin, color: 'text-yellow-600', bg: 'bg-yellow-50 dark:bg-yellow-900/20' },
              { label: 'Sakit', value: laporan.ringkasan.Sakit, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/20' },
              { label: 'Cuti', value: laporan.ringkasan.Cuti, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
              { label: 'Off', value: laporan.ringkasan.Off, color: 'text-pink-600', bg: 'bg-pink-50 dark:bg-pink-900/20' },
              { label: 'Alpha', value: laporan.ringkasan.Alpha, color: 'text-gray-600', bg: 'bg-gray-50 dark:bg-gray-800' },
            ].map((item) => (
              <div key={item.label} className={`${item.bg} rounded-xl p-4 text-center transition-colors`}>
                <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{item.label}</p>
              </div>
            ))}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden transition-colors">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <th className="p-3">Nama</th>
                    <th className="p-3 text-center">Hadir</th>
                    <th className="p-3 text-center">Telat</th>
                    <th className="p-3 text-center">Izin</th>
                    <th className="p-3 text-center">Sakit</th>
                    <th className="p-3 text-center">Cuti</th>
                    <th className="p-3 text-center">Off</th>
                    <th className="p-3 text-center">Alpha</th>
                    <th className="p-3 text-center">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {laporan.daftar.map((d, i) => (
                    <tr key={i} className="border-b border-gray-100 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="p-3 font-medium text-gray-800 dark:text-white">{d.Nama || '-'}</td>
                      <td className="p-3 text-center text-green-600">{d.Hadir}</td>
                      <td className="p-3 text-center text-red-600">{d.Telat}</td>
                      <td className="p-3 text-center text-yellow-600">{d.Izin}</td>
                      <td className="p-3 text-center text-orange-600">{d.Sakit}</td>
                      <td className="p-3 text-center text-blue-500">{d.Cuti}</td>
                      <td className="p-3 text-center text-pink-500">{d.Off}</td>
                      <td className="p-3 text-center text-gray-500">{d.Alpha}</td>
                      <td className="p-3 text-center font-medium">{d.Total}</td>
                    </tr>
                  ))}
                  {laporan.daftar.length === 0 && (
                    <tr><td colSpan={7} className="p-6 text-center text-gray-400">Belum ada data</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
            {[
              { label: 'Total Gaji', value: gajiBulanan.totalGaji, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
              { label: 'Total Lembur', value: gajiBulanan.totalLembur, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20' },
              { label: 'Total Net', value: gajiBulanan.totalNet, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' },
            ].map((item) => (
              <div key={item.label} className={`${item.bg} rounded-xl p-4 text-center transition-colors`}>
                <p className={`text-2xl font-bold ${item.color}`}>Rp {item.value.toLocaleString('id-ID')}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{item.label}</p>
              </div>
            ))}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden transition-colors">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <th className="p-3">Nama</th>
                    <th className="p-3 text-right">Gaji Pokok</th>
                    <th className="p-3 text-right">Harian</th>
                    <th className="p-3 text-center">Hadir</th>
                    <th className="p-3 text-right">Total Gaji</th>
                    <th className="p-3 text-right">Jam Lembur</th>
                    <th className="p-3 text-right">Total Lembur</th>
                    <th className="p-3 text-right">Net</th>
                  </tr>
                </thead>
                <tbody>
                  {gajiBulanan.daftar.map((d, i) => (
                    <tr key={i} className="border-b border-gray-100 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="p-3 font-medium text-gray-800 dark:text-white">{d.Nama || '-'}</td>
                      <td className="p-3 text-right">Rp {d.GajiPokok.toLocaleString('id-ID')}</td>
                      <td className="p-3 text-right">Rp {d.GajiHarian.toLocaleString('id-ID')}</td>
                      <td className="p-3 text-center">{d.Hadir}</td>
                      <td className="p-3 text-right">Rp {d.TotalGaji.toLocaleString('id-ID')}</td>
                      <td className="p-3 text-right">{d.JamLembur}</td>
                      <td className="p-3 text-right text-green-600">Rp {d.TotalLembur.toLocaleString('id-ID')}</td>
                      <td className="p-3 text-right font-semibold">Rp {d.Net.toLocaleString('id-ID')}</td>
                    </tr>
                  ))}
                  {gajiBulanan.daftar.length === 0 && (
                    <tr><td colSpan={8} className="p-6 text-center text-gray-400">Belum ada data</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </>
  )
}
