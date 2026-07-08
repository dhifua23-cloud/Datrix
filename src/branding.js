const logoImg = localStorage.getItem('brand_logo_img')
export const BRAND = {
  name: localStorage.getItem('brand_nama') || 'Datrix',
  tagline: localStorage.getItem('brand_tagline') || 'Digital Attendance & Tracking Information System',
  logo: localStorage.getItem('brand_logo') || 'Dx',
  logoImg: logoImg || null,
  primaryColor: localStorage.getItem('brand_warna') || '#2563eb',
}
