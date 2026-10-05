import { useEffect, useState } from 'react'
import { AuthContext } from './authContext'
import authService from '../services/authService'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('auth_user')

    return storedUser ? JSON.parse(storedUser) : null
  })

  const [loading, setLoading] = useState(
    () => Boolean(localStorage.getItem('auth_token')),
  )

  useEffect(() => {
    const token = localStorage.getItem('auth_token')

    if (!token) {
      return
    }

    authService
      .getMe()
      .then((response) => {
        const authenticatedUser = response.data

        setUser(authenticatedUser)
        localStorage.setItem(
          'auth_user',
          JSON.stringify(authenticatedUser),
        )
      })
      .catch(() => {
        localStorage.removeItem('auth_token')
        localStorage.removeItem('auth_user')
        setUser(null)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  const login = async (credentials) => {
    const response = await authService.login(credentials)

    const token = response.token
    const authenticatedUser = response.data

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
    const authenticatedUser = response.data

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
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}