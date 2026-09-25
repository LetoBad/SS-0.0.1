import { createContext, useContext, useMemo, useState } from 'react'
import {
  clearSession,
  getSession,
  loginWithPassword,
  registerUser,
} from '../lib/db.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getSession())

  const value = useMemo(
    () => ({
      user,
      setUser,
      async login(email, password) {
        const sessionUser = await loginWithPassword(email, password)
        setUser(sessionUser)
        return sessionUser
      },
      async register(form) {
        const sessionUser = await registerUser(form)
        setUser(sessionUser)
        return sessionUser
      },
      logout() {
        clearSession()
        setUser(null)
      },
    }),
    [user]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider.')
  }
  return context
}
