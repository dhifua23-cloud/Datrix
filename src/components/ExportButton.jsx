import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

export default function ExportButton({ absensi }) {
  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(absensi)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Absensi')
    XLSX.writeFile(wb, `rekap_absensi_${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  const exportPDF = () => {
    const doc = new jsPDF()
    doc.text('Rekap Absensi', 14, 15)
    doc.setFontSize(10)
    doc.text(`Tanggal: ${new Date().toLocaleDateString('id-ID')}`, 14, 22)

    const headers = ['Tanggal', 'NIK', 'Nama', 'Jabatan', 'Area', 'Jam Masuk', 'Jam Pulang', 'Status', 'Telat', 'Pulang Cepat']
    const rows = absensi.map((d) => [
      d.Tanggal?.slice(0, 10) || '',
      d.NIK || '',
      d.Nama || '',
      d.Jabatan || '',
      d.Area || '',
      d['Jam Masuk'] || '',
      d['Jam Pulang'] || '',
      d['Status Kehadiran'] || '',
      d['Telat (Menit)'] || '',
      d['Pulang Cepat (Menit)'] || '',
    ])

    doc.autoTable({
      head: [headers],
      body: rows,
      startY: 28,
      styles: { fontSize: 7 },
      headStyles: { fillColor: [59, 130, 246] },
    })

    doc.save(`rekap_absensi_${new Date().toISOString().slice(0, 10)}.pdf`)
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={exportExcel}
        className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
      >
        Export Excel
      </button>
      <button
        onClick={exportPDF}
        className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700"
      >
        Export PDF
      </button>
    </div>
  )
}
