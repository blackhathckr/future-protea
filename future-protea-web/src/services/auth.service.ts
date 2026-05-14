import api from '@/lib/api'

interface LoginRequest {
  email: string
  password: string
}

interface LoginResponse {
  token: string
  user: {
    id: string
    name: string
    email: string
    role: string
    phone?: string
    photo_url?: string
    approved: boolean
  }
}

interface User {
  id: string
  name: string
  email: string
  role: string
  phone?: string
  photoUrl?: string
  approved: boolean
}

class AuthService {
  static async login(data: LoginRequest): Promise<LoginResponse> {
    const response = await api.post('/auth/login', data)
    return response.data
  }

  static async register(data: any): Promise<any> {
    const response = await api.post('/auth/register', data)
    return response.data
  }

  static async getMe(): Promise<User> {
    const response = await api.get('/auth/me')
    // Transform snake_case to camelCase
    const user = response.data
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      photoUrl: user.photo_url,
      approved: user.approved,
    }
  }

  static async updateProfile(data: any): Promise<User> {
    const response = await api.put('/auth/profile', data)
    const user = response.data
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      photoUrl: user.photo_url,
      approved: user.approved,
    }
  }

  static async logout(): Promise<void> {
    // Simple logout - clear local state
    return Promise.resolve()
  }
}

export default AuthService
export { AuthService }
export type { LoginRequest, LoginResponse, User }
