import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { initializeAxiosAuth } from '@/lib/api'
import { AuthService, type LoginRequest, type User } from '@/services/auth.service'
import { toast } from 'sonner'

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  token: string | null
  login: (data: LoginRequest) => Promise<{ success: boolean; message?: string }>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const queryClient = useQueryClient()

  // Initialize axios auth integration once
  useEffect(() => {
    initializeAxiosAuth({
      getAccessToken: () => token,
      onTokenRefreshed: () => {},
      onAuthFailed: () => {
        setUser(null)
        setToken(null)
        localStorage.removeItem('token')
        toast.error('Session expired. Please log in again.')
      },
    })
  }, [token])

  // On mount: restore session from localStorage
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const savedToken = localStorage.getItem('token')
        if (savedToken) {
          setToken(savedToken)
          const userData = await AuthService.getMe()
          setUser(userData)
        }
      } catch {
        localStorage.removeItem('token')
      } finally {
        setIsLoading(false)
      }
    }

    restoreSession()
  }, [])

  const login = useCallback(async (data: LoginRequest) => {
    try {
      const response = await AuthService.login(data)
      const { token: authToken, user: userData } = response
      
      setToken(authToken)
      localStorage.setItem('token', authToken)
      
      // Transform user data
      const transformedUser: User = {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        phone: userData.phone,
        photoUrl: userData.photo_url,
        approved: userData.approved,
      }
      
      setUser(transformedUser)
      return { success: true }
    } catch (error: any) {
      const message = error.response?.data?.error || 'Login failed'
      return { success: false, message }
    }
  }, [])

  const refreshUser = useCallback(async () => {
    try {
      const userData = await AuthService.getMe()
      setUser(userData)
    } catch {
      // Ignore — user will remain as-is
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await AuthService.logout()
    } catch {
      // Ignore logout API errors
    } finally {
      setUser(null)
      setToken(null)
      localStorage.removeItem('token')
      queryClient.clear()
    }
  }, [queryClient])

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user && !!token,
        isLoading,
        token,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
