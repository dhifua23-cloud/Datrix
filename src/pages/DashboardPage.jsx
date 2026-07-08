import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { fetchAbsensi } from '../services/sheetsApi'
import SummaryCards from '../components/SummaryCards'
import BelumAbsen from '../components/BelumAbsen'
import Pelanggaran from '../components/Pelanggaran'
import GrafikKehadiran from '../components/GrafikKehadiran'
import FilterBar from '../components/FilterBar'
import RiwayatKaryawan from '../components/RiwayatKaryawan'
import KalenderAbsensi from '../components/KalenderAbsensi'
import ExportButton from '../components/ExportButton'
import { SkeletonCard, SkeletonTable, SkeletonChart } from '../components/Skeleton'

export default function DashboardPage() {
  const { absensi, karyawan, loading } = useApp()
  const [areaFilter, setAreaFilter] = useState('Semua Area')
  const [namaFilter, setNamaFilter] = useState('Semua Karyawan')
  const [selectedNama, setSelectedNama] = useState(null)

  const filteredAbsensi = absensi.filter((d) => {
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
            {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            &nbsp;&middot; Total Karyawan: {karyawan.length}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <FilterBar absensi={absensi} areaFilter={areaFilter} setAreaFilter={setAreaFilter} namaFilter={namaFilter} setNamaFilter={setNamaFilter} />
          <ExportButton absensi={filteredAbsensi} />
        </div>
      </header>

      <div className="space-y-6">
        <SummaryCards data={filteredAbsensi} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <BelumAbsen absensi={filteredAbsensi} karyawan={karyawan} onLihat={(nama) => setSelectedNama(nama)} />
          <Pelanggaran data={filteredAbsensi} />
        </div>

        <GrafikKehadiran data={filteredAbsensi} />
        <KalenderAbsensi absensi={filteredAbsensi} />
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
