import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { fetchAbsensi } from '../services/sheetsApi'
import SummaryCards from '../components/SummaryCards'
import BelumAbsen from '../components/BelumAbsen'
import SudahAbsen from '../components/SudahAbsen'
import StatusHariIni from '../components/StatusHariIni'
import Pelanggaran from '../components/Pelanggaran'
import GrafikKehadiran from '../components/GrafikKehadiran'
import FilterBar from '../components/FilterBar'
import RiwayatKaryawan from '../components/RiwayatKaryawan'
import KalenderAbsensi from '../components/KalenderAbsensi'
import ExportButton from '../components/ExportButton'
import { SkeletonCard, SkeletonTable, SkeletonChart } from '../components/Skeleton'

export default function DashboardPage() {
  const { absensi, karyawan, daftarArea, loading } = useApp()
  const [areaFilter, setAreaFilter] = useState('Semua Area')
  const [namaFilter, setNamaFilter] = useState('Semua Karyawan')
  const [selectedNama, setSelectedNama] = useState(null)
  const [tglFilter, setTglFilter] = useState('')

  const filteredAbsensi = absensi.filter((d) => {
    if (areaFilter !== 'Semua Area' && d.Area !== areaFilter) return false
    if (namaFilter !== 'Semua Karyawan' && d.Nama !== namaFilter) return false
    if (tglFilter && !d.Tanggal?.startsWith(tglFilter)) return false
    return true
  })

  const grafikData = absensi.filter((d) => {
    if (areaFilter !== 'Semua Area' && d.Area !== areaFilter) return false
    if (namaFilter !== 'Semua Karyawan' && d.Nama !== namaFilter) return false
    return true
  })

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SkeletonTable />
          <SkeletonTable />
        </div>
        <SkeletonChart />
      </div>
    )
  }

  return (
    <>
      <header className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">Dashboard</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {tglFilter
              ? new Date(tglFilter).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
              : new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            &nbsp;&middot; Total Karyawan: {karyawan.length}
            {tglFilter && <button onClick={() => setTglFilter('')} className="ml-2 text-xs text-red-500 hover:underline">Hari Ini</button>}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <FilterBar absensi={absensi} areaList={daftarArea} areaFilter={areaFilter} setAreaFilter={setAreaFilter} namaFilter={namaFilter} setNamaFilter={setNamaFilter} />
          <ExportButton absensi={filteredAbsensi} />
        </div>
      </header>

      <div className="space-y-6">
        <SummaryCards data={filteredAbsensi} onLihat={(nama) => setSelectedNama(nama)} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <BelumAbsen absensi={filteredAbsensi} karyawan={karyawan} onLihat={(nama) => setSelectedNama(nama)} />
          <SudahAbsen absensi={filteredAbsensi} onLihat={(nama) => setSelectedNama(nama)} />
          <Pelanggaran data={filteredAbsensi} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <StatusHariIni absensi={filteredAbsensi} title="Izin Hari Ini"
            filterFn={(d) => d['Status Kehadiran'] === 'Izin'}
            warna="text-yellow-600" onLihat={(nama) => setSelectedNama(nama)} />
          <StatusHariIni absensi={filteredAbsensi} title="Cuti Hari Ini"
            filterFn={(d) => (d['Status Kehadiran'] || '').toLowerCase().includes('cuti')}
            warna="text-blue-600" onLihat={(nama) => setSelectedNama(nama)} />
          <StatusHariIni absensi={filteredAbsensi} title="Off Hari Ini"
            filterFn={(d) => (d['Shift'] || d['shift'] || '').toLowerCase() === 'off'}
            warna="text-pink-600" onLihat={(nama) => setSelectedNama(nama)} />
        </div>

        <GrafikKehadiran data={grafikData} />
        <KalenderAbsensi absensi={filteredAbsensi} onSelectDate={(d) => setTglFilter(d)} />
      </div>

      {selectedNama && (
        <RiwayatKaryawan
          absensi={absensi}
          karyawan={karyawan}
          nama={selectedNama}
          onClose={() => setSelectedNama(null)}
        />
      )}
    </>
  )
}
