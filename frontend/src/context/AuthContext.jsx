import { useEffect, useState } from 'react'
import { AuthContext } from './authContext'
import authService from '../services/authService'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('auth_user')

    if (!storedUser || storedUser === 'undefined') {
      return null
    }

    try {
      return JSON.parse(storedUser)
    } catch {
      localStorage.removeItem('auth_user')
      return null
    }
  })

  const [loading, setLoading] = useState(() =>
    Boolean(localStorage.getItem('auth_token')),
  )

  useEffect(() => {
    const token = localStorage.getItem('auth_token')

    if (!token) {
      return
    }

    const authenticate = async () => {
      try {
        const response = await authService.getMe()
        const authenticatedUser = response.user

        setUser(authenticatedUser)

        localStorage.setItem(
          'auth_user',
          JSON.stringify(authenticatedUser),
        )
      } catch {
        localStorage.removeItem('auth_token')
        localStorage.removeItem('auth_user')
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    authenticate()
  }, [])

  const login = async (credentials) => {
    const response = await authService.login(credentials)

    const token = response.token
    const authenticatedUser = response.user

    localStorage.setItem('auth_token', token)
    localStorage.setItem(
      'auth_user',
      JSON.stringify(authenticatedUser),
    )

    setUser(authenticatedUser)

    return authenticatedUser
  }

  const register = async (data) => {
    const response = await authService.register(data)

    const token = response.token
    const authenticatedUser = response.user

    localStorage.setItem('auth_token', token)
    localStorage.setItem(
      'auth_user',
      JSON.stringify(authenticatedUser),
    )

    setUser(authenticatedUser)

    return authenticatedUser
  }

  const logout = async () => {
    try {
      await authService.logout()
    } finally {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_user')
      setUser(null)
    }
  }

  const value = {
    user,
    loading,
    isAuthenticated: Boolean(user),
    login,
    register,
    logout,
    setUser,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}