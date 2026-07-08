export function parseDuration(val) {
  if (!val || val === '-') return 0
  const trimmed = String(val).trim()
  let total = 0
  const jamMatch = trimmed.match(/(\d+)j/)
  if (jamMatch) total += parseInt(jamMatch[1]) * 60
  const menitMatch = trimmed.match(/(\d+)m/)
  if (menitMatch) total += parseInt(menitMatch[1])
  return total
}

export function formatDuration(minutes) {
  if (minutes <= 0) return '-'
  const jam = Math.floor(minutes / 60)
  const menit = minutes % 60
  if (jam > 0) return `${jam}j ${menit}m`
  return `${menit}m`
}

export function getNextEmployeeId(karyawan) {
  const prefix = 'EMS-'
  let max = 0
  karyawan.forEach((k) => {
    const id = k['Employee Id'] || ''
    if (id.startsWith(prefix)) {
      const num = parseInt(id.replace(prefix, '')) || 0
      if (num > max) max = num
    }
  })
  return `${prefix}${max + 1}`
}

