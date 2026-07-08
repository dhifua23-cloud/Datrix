const storedKey = localStorage.getItem('VITE_GOOGLE_API_KEY')
const storedSS = localStorage.getItem('CURRENT_SPREADSHEET_ID')

export const SPREADSHEET_ID = storedSS || '13s7cWGyXc5i_4tE_OUBK_ootJ6ThqaaV6a4E_EgQD2s'
export const API_KEY = storedKey || import.meta.env.VITE_GOOGLE_API_KEY || ''
export const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL || ''
export const RANGE_ABSEN = 'Master Absen!A:Y'
export const RANGE_KARYAWAN = 'Master_Karyawan!A:W'
export const RANGE_GAJI = 'Master_Gaji!A4:T'
export const RANGE_SHIFT = 'Master_Shift!A:C'
export const RANGE_AREA = 'Daftar_Area!A:E'
