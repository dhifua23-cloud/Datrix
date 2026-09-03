import { useState, useMemo } from 'react'
import { useApp } from '../context/AppContext'
import { APPS_SCRIPT_URL } from '../config'
import { parseDuration } from '../services/utils'
import { SkeletonTable } from '../components/Skeleton'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import JSZip from 'jszip'

export default function GajiPage() {
  const { absensi, karyawan, gaji, loading, showToast, updateGaji } = useApp()
  const [startDate, setStartDate] = useState(() => `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-01`)
  const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [areaFilter, setAreaFilter] = useState('Semua Area')
  const [edit, setEdit] = useState(null)
  const [form, setForm] = useState({ gajiPokok: '', gajiHarian: '', lembur: '', insentif: '', sp1: '', sp2: '', d30: '', d60: '', d60p: '' })
  const [lemburGlobal, setLemburGlobal] = useState(() => localStorage.getItem('gaji_lemburGlobal') || '')
  const [globalBorongan, setGlobalBorongan] = useState(() => localStorage.getItem('gaji_borongan') || '')
  const [globalHarian, setGlobalHarian] = useState(() => localStorage.getItem('gaji_harian') || '')
  const [lemburManual, setLemburManual] = useState({})
  const [insentifPH, setInsentifPH] = useState({})
  const [sp1State, setSp1State] = useState({})
  const [sp2State, setSp2State] = useState({})
  const [denda30State, setDenda30State] = useState({})
  const [denda60State, setDenda60State] = useState({})
  const [denda60plusState, setDenda60plusState] = useState({})
  const periodeLabel = `${startDate} sd ${endDate}`

  const daftarArea = useMemo(() => {
    const areas = new Set(karyawan.map((k) => k.Area).filter(Boolean))
    return ['Semua Area', ...areas]
  }, [karyawan])

  const bersihkanAngka = (val) => parseInt(String(val).replace(/[^0-9]/g, '')) || 0
  const formatJamMenit = (mnt) => {
    if (!mnt) return '0'
    const jam = Math.floor(mnt / 60)
    const menit = mnt % 60
    if (jam === 0) return `${menit} menit`
    if (menit === 0) return `${jam} jam`
    return `${jam} jam ${menit} menit`
  }

  const gajiMap = useMemo(() => {
    const map = {}
    gaji.forEach((g) => {
      const namaKey = (g['Nama'] || '').trim().toLowerCase()
      map[namaKey] = {
        gajiPokok: bersihkanAngka(g['Gaji Pokok']),
        gajiHarian: bersihkanAngka(g['Gaji Harian']),
      }
    })
    return map
  }, [gaji])

  const filteredKaryawan = useMemo(() => {
    if (areaFilter === 'Semua Area') return karyawan
    return karyawan.filter((k) => k.Area === areaFilter)
  }, [karyawan, areaFilter])

  const rekap = useMemo(() => {
    const filtered = absensi.filter((d) => {
      if (!d.Tanggal) return false
      const tgl = d.Tanggal.slice(0, 10)
      return tgl >= startDate && tgl <= endDate
    })

    const perNama = {}
    filtered.forEach((d) => {
      const nama = (d.Nama || '').trim().toLowerCase()
      if (!perNama[nama]) {
        perNama[nama] = { hadir: 0, telatMenit: 0, lemburJam: 0 }
      }
      if (d['Status Kehadiran'] === 'Hadir' || d['Status Kehadiran'] === 'Telat') {
        perNama[nama].hadir++
      }
      perNama[nama].telatMenit += parseDuration(d['Telat (Menit)'])
      const lm = d['Jam Mulai Lembur'] || ''
      const lk = d['Jam Selesai Lembur'] || ''
      if (lm && lk) {
        const [hj, hm] = lm.split(':').map(Number)
        const [kj, km] = lk.split(':').map(Number)
        const dur = ((kj * 60 + km) - (hj * 60 + hm)) / 60
        if (dur > 0) perNama[nama].lemburJam += dur
      }
    })

    return filteredKaryawan.map((k, idx) => {
      const namaKey = (k.Nama || '').trim().toLowerCase()
      const d = perNama[namaKey] || { hadir: 0, telatMenit: 0, lemburJam: 0 }
      const id = k['Employee Id'] || ''
      const gajiPokok = parseInt(globalBorongan) || gajiMap[namaKey]?.gajiPokok || 0
      const gajiHarian = parseInt(globalHarian) || gajiMap[namaKey]?.gajiHarian || Math.round(gajiPokok / 30)
      const jamLembur = Math.round(d.lemburJam * 10) / 10
      const rateLembur = parseInt(lemburManual[namaKey]) || parseInt(lemburGlobal) || 20000
      const gajiLembur = Math.round(jamLembur * rateLembur)
      const totalGajiHarian = gajiHarian * d.hadir
      const totalGaji = totalGajiHarian + gajiLembur
      const mnt = d.telatMenit
      const sp1Val = parseInt(sp1State[namaKey]) || 0
      const sp2Val = parseInt(sp2State[namaKey]) || 0
      const d30Val = parseInt(denda30State[namaKey]) || 0
      const d60Val = parseInt(denda60State[namaKey]) || 0
      const d60pVal = parseInt(denda60plusState[namaKey]) || 0
      const denda = sp1Val + sp2Val + d30Val + d60Val + d60pVal
      const insentif = parseInt(insentifPH[namaKey]) || 0
      const nettGaji = totalGaji + insentif
      const netSalary = Math.max(0, nettGaji - denda)

      return {
        no: idx + 1, nama: k.Nama, namaKey, area: k.Area, jabatan: k.Jabatan,
        bank: k['NAMA BANK'] || k['Nama Bank'] || '-',
        rekening: k['Nomor Rekening'] || '-',
        gajiBorongan: gajiPokok, gajiHarian, hariKerja: d.hadir,
        gajiLembur, jamLembur, rateLembur, insentif,
        totalGajiHarian, totalGajiLembur: gajiLembur, totalGaji,
        nettGaji: totalGaji,
        denda, sp1Val, sp2Val, d30Val, d60Val, d60pVal,
        totalMenitTelat: mnt,
        netSalary, id,
        gajiHarianConfig: gajiMap[namaKey]?.gajiHarian || 0,
      }
    })
  }, [absensi, filteredKaryawan, gajiMap, startDate, endDate])

  const exportExcel = () => {
    const data = rekap.map((d) => ({
      No: d.no, Nama: d.nama, Area: d.area, Bank: d.bank, Rekening: d.rekening,
      'Gaji Borongan': d.gajiBorongan, 'Gaji Harian': d.gajiHarian,
      'Hari Kerja': d.hariKerja, 'Rate Lembur': d.rateLembur,
      'Jam Lembur': d.jamLembur, 'Gaji Lembur': d.gajiLembur,
      'Total Gaji Harian': d.totalGajiHarian, 'Total Lembur': d.totalGajiLembur,
      'Insentif PH': d.insentif, 'Nett Gaji': d.totalGajiHarian + d.totalGajiLembur + d.insentif,
      'SP1': d.sp1Val, 'SP2': d.sp2Val, '30m': d.d30Val, '60m': d.d60Val, '60++': d.d60pVal,
      'Total Denda': d.denda, 'Net Salary': d.netSalary,
    }))
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Gaji')
    XLSX.writeFile(wb, `gaji_${startDate}_sampai_${endDate}.xlsx`)
    showToast('Download Excel berhasil')
  }

  const exportPDF = () => {
    const doc = new jsPDF('landscape')
    doc.text(`Rekap Gaji ${startDate} sd ${endDate}`, 14, 15)
    const headers = [['No', 'Nama', 'Gaji Borongan', 'Gaji Harian', 'Hari', 'Rate', 'Jam', 'Gaji Lembur', 'Total Gaji', 'Insentif', 'Nett Gaji', 'SP1', 'SP2', '30m', '60m', '60++', 'Denda', 'Net Salary']]
    const rows = rekap.map((d) => [
      d.no, d.nama, d.gajiBorongan, d.gajiHarian, d.hariKerja, d.rateLembur,
      d.jamLembur, d.gajiLembur, d.totalGajiHarian + d.totalGajiLembur,
      d.insentif, d.totalGajiHarian + d.totalGajiLembur + d.insentif,
      d.sp1Val, d.sp2Val, d.d30Val, d.d60Val, d.d60pVal,
      d.denda, d.netSalary,
    ])
    autoTable(doc, { head: headers, body: rows, styles: { fontSize: 7 }, headStyles: { fillColor: [59, 130, 246] } })
    doc.save(`gaji_${startDate}_sampai_${endDate}.pdf`)
    showToast('Download PDF berhasil')
  }

  const slipMassal = async () => {
    const zip = new JSZip()
    rekap.forEach((d) => {
      const doc = new jsPDF()
      doc.setFontSize(16); doc.text('DATRIX', 14, 20)
      doc.setFontSize(8); doc.text('Digital Attendance & Tracking Information System', 14, 26)
      doc.setFontSize(14); doc.text('SLIP GAJI', 105, 20, { align: 'center' })
      doc.setFontSize(10); doc.text(`${periodeLabel}`, 105, 27, { align: 'center' })
      doc.setFontSize(10)
      doc.text(`Nama: ${d.nama}`, 14, 40); doc.text(`Area: ${d.area}`, 14, 46); doc.text(`Jabatan: ${d.jabatan}`, 14, 52)
      doc.text(`Bank: ${d.bank} - ${d.rekening}`, 14, 58)
      autoTable(doc, {
        startY: 65, head: [['Komponen', 'Nominal']],
        body: [
          ['Gaji Borongan', `Rp ${d.gajiBorongan.toLocaleString('id-ID')}`],
          ['Gaji Harian', `Rp ${d.gajiHarian.toLocaleString('id-ID')}`],
          ['Hari Kerja', `${d.hariKerja} hari`],
          ['Total Gaji Harian', `Rp ${(d.gajiHarian * d.hariKerja).toLocaleString('id-ID')}`],
          ['Jam Lembur', `${d.jamLembur} jam`],
          ['Total Lembur', `Rp ${d.totalGajiLembur.toLocaleString('id-ID')}`],
          ['Insentif PH', `Rp ${d.insentif.toLocaleString('id-ID')}`],
          ['Nett Gaji', `Rp ${(d.totalGajiHarian + d.totalGajiLembur + d.insentif).toLocaleString('id-ID')}`, { styles: { fontStyle: 'bold' } }],
          ['Potongan SP1', `Rp ${(d.sp1Val * 10000).toLocaleString('id-ID')}`],
          ['Potongan SP2', `Rp ${(d.sp2Val * 25000).toLocaleString('id-ID')}`],
          ['Potongan Lain', `Rp ${(d.d30Val + d.d60Val + d.d60pVal).toLocaleString('id-ID')}`],
          ['Total Potongan', `Rp ${d.denda.toLocaleString('id-ID')}`, { styles: { fontStyle: 'bold', textColor: [220, 38, 38] } }],
          ['NET SALARY', `Rp ${d.netSalary.toLocaleString('id-ID')}`, { styles: { fontStyle: 'bold', fontSize: 12, textColor: [37, 99, 235] } }],
        ],
        styles: { fontSize: 9 }, headStyles: { fillColor: [59, 130, 246] },
      })
      const namaFile = `slip_${d.nama.replace(/\s+/g, '_')}.pdf`
      zip.file(namaFile, doc.output('blob'))
    })
    const content = await zip.generateAsync({ type: 'blob' })
    const url = URL.createObjectURL(content)
    const a = document.createElement('a'); a.href = url; a.download = `slip_gaji_${periodeLabel.replace(/[/:]/g, '-')}.zip`
    a.click(); URL.revokeObjectURL(url)
    showToast(`Download ${rekap.length} slip gaji`)
  }

  const slipGaji = (d) => {
    try {
    const doc = new jsPDF()
    const title = localStorage.getItem('brand_nama') || 'Datrix'

    doc.setFontSize(16)
    doc.text(title, 14, 20)
    doc.setFontSize(8)
    doc.text(localStorage.getItem('brand_tagline') || 'Digital Attendance & Tracking Information System', 14, 26)

    doc.setFontSize(14)
    doc.text('SLIP GAJI', 105, 20, { align: 'center' })
    doc.setFontSize(10)
    doc.text(`${periodeLabel}`, 105, 27, { align: 'center' })

    doc.setFontSize(10)
    doc.text(`Nama: ${d.nama}`, 14, 40)
    doc.text(`Area: ${d.area}`, 14, 46)
    doc.text(`Jabatan: ${d.jabatan}`, 14, 52)
    doc.text(`Bank: ${d.bank} - ${d.rekening}`, 14, 58)

    autoTable(doc, {
      startY: 65,
      head: [['Komponen', 'Nominal']],
      body: [
        ['Gaji Borongan', `Rp ${d.gajiBorongan.toLocaleString('id-ID')}`],
        ['Gaji Harian', `Rp ${d.gajiHarian.toLocaleString('id-ID')}`],
        ['Hari Kerja', `${d.hariKerja} hari`],
        ['Total Gaji Harian', `Rp ${(d.gajiHarian * d.hariKerja).toLocaleString('id-ID')}`],
        ['Jam Lembur', `${d.jamLembur} jam`],
        ['Total Lembur', `Rp ${d.totalGajiLembur.toLocaleString('id-ID')}`],
        ['Insentif PH', `Rp ${d.insentif.toLocaleString('id-ID')}`],
        ['Nett Gaji', `Rp ${(d.totalGajiHarian + d.totalGajiLembur + d.insentif).toLocaleString('id-ID')}`, { styles: { fontStyle: 'bold' } }],
        ['Potongan SP1', `Rp ${(d.sp1Val * 10000).toLocaleString('id-ID')}`],
        ['Potongan SP2', `Rp ${(d.sp2Val * 25000).toLocaleString('id-ID')}`],
        ['Potongan Lain', `Rp ${(d.d30Val + d.d60Val + d.d60pVal).toLocaleString('id-ID')}`],
        ['Total Potongan', `Rp ${d.denda.toLocaleString('id-ID')}`, { styles: { fontStyle: 'bold', textColor: [220, 38, 38] } }],
        ['NET SALARY', `Rp ${d.netSalary.toLocaleString('id-ID')}`, { styles: { fontStyle: 'bold', fontSize: 12, textColor: [37, 99, 235] } }],
      ],
      styles: { fontSize: 9 },
      headStyles: { fillColor: [59, 130, 246] },
    })
    doc.save(`slip_gaji_${d.nama.replace(/\s+/g, '_')}_${periodeLabel.replace(/[/:]/g, '-')}.pdf`)
    showToast(`Slip gaji ${d.nama} terdownload`)
    } catch (e) { showToast('Error: ' + e.message, 'error') }
  }

  const simpanGlobal = () => {
    localStorage.setItem('gaji_lemburGlobal', lemburGlobal)
    localStorage.setItem('gaji_borongan', globalBorongan)
    localStorage.setItem('gaji_harian', globalHarian)
    showToast('Nilai global tersimpan')
  }

  const simpanGaji = async () => {
    const nominal = bersihkanAngka(form.gajiPokok)
    const harian = bersihkanAngka(form.gajiHarian)
    if (!edit) return
    try {
      await fetch(APPS_SCRIPT_URL, {
        method: 'POST', mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'update_salary',
        nama: edit,
        gajiPokok: nominal,
        gajiHarian: harian,
      }),
    })
    updateGaji(edit, nominal, harian)
    if (form.lembur) setLemburManual({ ...lemburManual, [edit.toLowerCase()]: form.lembur })
    if (form.insentif) setInsentifPH({ ...insentifPH, [edit.toLowerCase()]: form.insentif })
    if (form.sp1) setSp1State({ ...sp1State, [edit.toLowerCase()]: form.sp1 })
    if (form.sp2) setSp2State({ ...sp2State, [edit.toLowerCase()]: form.sp2 })
    if (form.d30) setDenda30State({ ...denda30State, [edit.toLowerCase()]: form.d30 })
    if (form.d60) setDenda60State({ ...denda60State, [edit.toLowerCase()]: form.d60 })
    if (form.d60p) setDenda60plusState({ ...denda60plusState, [edit.toLowerCase()]: form.d60p })
    showToast('Gaji berhasil disimpan')
    setEdit(null)
    } catch (err) {
      showToast('Gagal: ' + err.message, 'error')
    }
  }

  if (loading) return <SkeletonTable />

  return (
    <>
      <header className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">Payroll</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 text-sm">
            <span className="text-gray-500">Rate/Jam:</span>
            <input type="text" inputMode="numeric" value={lemburGlobal}
              onChange={(e) => setLemburGlobal(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="20000"
              className="w-20 px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-white" />
          </div>
          <div className="flex items-center gap-1 text-sm">
            <span className="text-gray-500">Borongan:</span>
            <input type="text" inputMode="numeric" value={globalBorongan}
              onChange={(e) => setGlobalBorongan(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="0"
              className="w-20 px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-white" />
          </div>
          <div className="flex items-center gap-1 text-sm">
            <span className="text-gray-500">Harian:</span>
            <input type="text" inputMode="numeric" value={globalHarian}
              onChange={(e) => setGlobalHarian(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="0"
              className="w-20 px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-white" />
          </div>
          <button onClick={simpanGlobal}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">Simpan</button>
            <button onClick={slipMassal}
            className="px-3 py-1.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700">Slip All</button>
          <button onClick={exportExcel}
            className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700">Excel</button>
          <button onClick={exportPDF}
            className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700">PDF</button>
          <select value={areaFilter} onChange={(e) => setAreaFilter(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-white">
            {daftarArea.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
          <div className="flex items-center gap-1 text-sm">
            <span className="text-gray-500 dark:text-gray-400">Dari:</span>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1.5 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-white" />
          </div>
          <div className="flex items-center gap-1 text-sm">
            <span className="text-gray-500 dark:text-gray-400">Sampai:</span>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1.5 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-white" />
          </div>
        </div>
      </header>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-sm whitespace-nowrap">
            <thead>
              <tr className="text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <th className="p-2" rowSpan={2}>No</th>
                <th className="p-2" rowSpan={2}>Nama</th>
                <th className="p-2" rowSpan={2}>Area</th>
                <th className="p-2" rowSpan={2}>Bank</th>
                <th className="p-2" rowSpan={2}>Rekening</th>
                <th className="p-2" colSpan={2}>Gaji</th>
                <th className="p-2" rowSpan={2}>Hari Kerja</th>
                <th className="p-2" colSpan={2}>Lembur</th>
                <th className="p-2" colSpan={2}>Total</th>
                <th className="p-2" rowSpan={2}>Insentif PH</th>
                <th className="p-2" rowSpan={2}>Nett Gaji</th>
                <th className="p-2" colSpan={6}>Denda</th>
                <th className="p-2" rowSpan={2}>Total Denda</th>
                <th className="p-2" rowSpan={2}>Net Salary</th>
                <th className="p-2" rowSpan={2}></th>
              </tr>
              <tr className="text-gray-400 dark:text-gray-500 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <th className="p-2">Borongan</th>
                <th className="p-2">Harian</th>
                <th className="p-2">Nominal</th>
                <th className="p-2">Jam</th>
                <th className="p-2">Gaji Harian</th>
                <th className="p-2">Lembur</th>
                <th className="p-2">SP1</th>
                <th className="p-2">SP2</th>
                <th className="p-2">30m</th>
                <th className="p-2">60m</th>
                <th className="p-2">60++</th>
                <th className="p-2">Menit</th>
              </tr>
            </thead>
            <tbody>
              {rekap.map((d, i) => (
                <tr key={i} className="border-b border-gray-100 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="p-2 text-center text-gray-500">{d.no}</td>
                  <td className="p-2 font-medium text-gray-800 dark:text-white whitespace-nowrap">{d.nama}</td>
                  <td className="p-2 text-gray-600 dark:text-gray-400">{d.area}</td>
                  <td className="p-2 text-gray-600 dark:text-gray-400">{d.bank}</td>
                  <td className="p-2 text-gray-600 dark:text-gray-400">{d.rekening}</td>
                  <td className="p-2 text-right relative">
                    {edit === d.nama ? (
                      <input type="number" value={form.gajiPokok}
                        onChange={(e) => setForm({ ...form, gajiPokok: e.target.value })}
                        className="w-20 px-1 py-0.5 border rounded text-right text-sm bg-white dark:bg-gray-700" />
                    ) : (
                      <span className="text-gray-800 dark:text-white">Rp {d.gajiBorongan.toLocaleString('id-ID')}</span>
                    )}
                  </td>
                  <td className="p-2 text-right">
                    {edit === d.nama ? (
                      <input type="number" value={form.gajiHarian}
                        onChange={(e) => setForm({ ...form, gajiHarian: e.target.value })}
                        placeholder="Auto"
                        className="w-20 px-1 py-0.5 border rounded text-right text-sm bg-white dark:bg-gray-700" />
                    ) : (
                      <span className="text-gray-600 dark:text-gray-400">Rp {d.gajiHarian.toLocaleString('id-ID')}</span>
                    )}
                  </td>
                  <td className="p-2 text-right text-gray-800 dark:text-white">{d.hariKerja}</td>
                  <td className="p-2 text-right text-green-600">
                    {edit === d.nama ? (
                      <input type="number" value={form.lembur}
                        onChange={(e) => setForm({ ...form, lembur: e.target.value })}
                        placeholder="Rate"
                        className="w-20 px-1 py-0.5 border rounded text-right text-sm bg-white dark:bg-gray-700" />
                    ) : (
                      <>Rp {d.rateLembur.toLocaleString('id-ID')}</>
                    )}
                  </td>
                  <td className="p-2 text-right text-gray-600 dark:text-gray-400">{d.jamLembur}</td>
                  <td className="p-2 text-right text-gray-800 dark:text-white">Rp {d.totalGajiHarian.toLocaleString('id-ID')}</td>
                  <td className="p-2 text-right text-green-600">Rp {d.totalGajiLembur.toLocaleString('id-ID')}</td>
                  <td className="p-2 text-right text-blue-600">
                    {edit === d.nama ? (
                      <input type="number" value={form.insentif}
                        onChange={(e) => setForm({ ...form, insentif: e.target.value })}
                        placeholder="0"
                        className="w-20 px-1 py-0.5 border rounded text-right text-sm bg-white dark:bg-gray-700" />
                    ) : (
                      <>Rp {d.insentif.toLocaleString('id-ID')}</>
                    )}
                  </td>
                  <td className="p-2 text-right font-semibold text-gray-800 dark:text-white">Rp {(d.totalGajiHarian + d.totalGajiLembur + d.insentif).toLocaleString('id-ID')}</td>
                  <td className="p-2 text-center">
                    {edit === d.nama ? (
                      <input type="number" value={form.sp1} onChange={(e) => setForm({ ...form, sp1: e.target.value })}
                        className="w-16 px-1 py-0.5 border rounded text-center text-sm bg-white dark:bg-gray-700" />
                    ) : <span className="text-red-500">{d.sp1Val ? `Rp ${d.sp1Val.toLocaleString('id-ID')}` : '-'}</span>}
                  </td>
                  <td className="p-2 text-center">
                    {edit === d.nama ? (
                      <input type="number" value={form.sp2} onChange={(e) => setForm({ ...form, sp2: e.target.value })}
                        className="w-16 px-1 py-0.5 border rounded text-center text-sm bg-white dark:bg-gray-700" />
                    ) : <span className="text-red-500">{d.sp2Val ? `Rp ${d.sp2Val.toLocaleString('id-ID')}` : '-'}</span>}
                  </td>
                  <td className="p-2 text-center">
                    {edit === d.nama ? (
                      <input type="number" value={form.d30} onChange={(e) => setForm({ ...form, d30: e.target.value })}
                        className="w-16 px-1 py-0.5 border rounded text-center text-sm bg-white dark:bg-gray-700" />
                    ) : <span className="text-red-500">{d.d30Val ? `Rp ${d.d30Val.toLocaleString('id-ID')}` : '-'}</span>}
                  </td>
                  <td className="p-2 text-center">
                    {edit === d.nama ? (
                      <input type="number" value={form.d60} onChange={(e) => setForm({ ...form, d60: e.target.value })}
                        className="w-16 px-1 py-0.5 border rounded text-center text-sm bg-white dark:bg-gray-700" />
                    ) : <span className="text-red-500">{d.d60Val ? `Rp ${d.d60Val.toLocaleString('id-ID')}` : '-'}</span>}
                  </td>
                  <td className="p-2 text-center">
                    {edit === d.nama ? (
                      <input type="number" value={form.d60p} onChange={(e) => setForm({ ...form, d60p: e.target.value })}
                        className="w-16 px-1 py-0.5 border rounded text-center text-sm bg-white dark:bg-gray-700" />
                    ) : <span className="text-red-500">{d.d60pVal ? `Rp ${d.d60pVal.toLocaleString('id-ID')}` : '-'}</span>}
                  </td>
                  <td className="p-2 text-right text-red-400">{formatJamMenit(d.totalMenitTelat)}</td>
                  <td className="p-2 text-right font-medium text-red-600">Rp {d.denda.toLocaleString('id-ID')}</td>
                  <td className="p-2 text-right font-bold text-blue-600">Rp {d.netSalary.toLocaleString('id-ID')}</td>
                  <td className="p-2">
                    <div className="flex gap-1">
                      {edit === d.nama ? (
                        <>
                          <button onClick={simpanGaji} className="text-xs px-2 py-1 bg-blue-600 text-white rounded">✓</button>
                          <button onClick={() => setEdit(null)} className="text-xs px-2 py-1 border rounded">✕</button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => { setEdit(d.nama); setForm({ gajiPokok: d.gajiBorongan || '', gajiHarian: d.gajiHarianConfig || '', lembur: lemburManual[d.namaKey] || '', insentif: insentifPH[d.namaKey] || '', sp1: sp1State[d.namaKey] || '', sp2: sp2State[d.namaKey] || '', d30: denda30State[d.namaKey] || '', d60: denda60State[d.namaKey] || '', d60p: denda60plusState[d.namaKey] || '' }) }}
                            className="text-xs px-2 py-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded">Atur</button>
                          <button onClick={() => slipGaji(d)}
                            className="text-xs px-2 py-1 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded">Slip</button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
