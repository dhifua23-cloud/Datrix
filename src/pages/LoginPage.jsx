import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { BRAND } from '../branding'

const MASTER_SPREADSHEET_ID = '1v5VEHQlPS7G8mYbqQ4A0HJu2XFhsw80rxr08Vrp1P0o'
const MASTER_API_KEY = 'AIzaSyDoprw2uGbqPaJGn5pz3ziX7PgB3HfpA0w'

export default function LoginPage() {
  const { login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [shake, setShake] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!username || !password) { setError('Isi username & password'); setShake(true); setTimeout(() => setShake(false), 500); return }
    setLoading(true); setError('')

    try {
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${MASTER_SPREADSHEET_ID}/values/Sheet1?key=${MASTER_API_KEY}`
      const res = await fetch(url)
      const data = await res.json()
      if (!data.values) { setError('Gagal membaca data'); setLoading(false); return }

      const rows = data.values.slice(1)
      let found = null
      for (const row of rows) {
        if (row[1] && row[1].toString().toLowerCase() === username.toLowerCase() &&
            row[2] && row[2].toString() === password) {
          found = { nama: row[0], username: row[1], spreadsheetId: row[3], apiKey: row[4] }
          break
        }
      }

      if (found) {
        login(found)
      } else {
        setError('Username atau password salah')
        setShake(true); setTimeout(() => setShake(false), 500)
      }
    } catch (err) {
      setError('Gagal terhubung: ' + err.message)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
      <div className={`w-full max-w-sm animate-fade-in ${shake ? 'animate-shake' : ''}`}>
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
          {/* Logo */}
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-2xl mx-auto mb-3 overflow-hidden" style={{ backgroundColor: BRAND.primaryColor }}>
              {BRAND.logoImg ? <img src={BRAND.logoImg} alt="" className="w-full h-full object-contain" /> : BRAND.logo}
            </div>
            <h1 className="text-xl font-bold text-gray-800 dark:text-white">{BRAND.name}</h1>
            <p className="text-sm text-gray-500 mt-0.5">{BRAND.tagline}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Username</label>
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-white mt-1 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="Masukkan username" autoFocus />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
              <div className="relative mt-1">
                <input type={showPw ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  placeholder="Masukkan password" />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm">
                  {showPw ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {error && <p className="text-sm text-red-500 text-center">{error}</p>}

            <button type="submit" disabled={loading}
              className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-70 transition-all flex items-center justify-center gap-2">
              {loading ? (
                <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> Memeriksa...</>
              ) : 'Masuk'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">© 2026 {BRAND.name} v1.0</p>
      </div>
    </div>
  )
}
