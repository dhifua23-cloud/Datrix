import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('auth_user')
    return saved ? JSON.parse(saved) : null
  })

  const login = (userData) => {
    setUser(userData)
    localStorage.setItem('auth_user', JSON.stringify(userData))
    localStorage.setItem('VITE_GOOGLE_API_KEY', userData.apiKey)
    localStorage.setItem('CURRENT_SPREADSHEET_ID', userData.spreadsheetId)
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('auth_user')
    localStorage.removeItem('VITE_GOOGLE_API_KEY')
    localStorage.removeItem('CURRENT_SPREADSHEET_ID')
    window.location.reload()
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
