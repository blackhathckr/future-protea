export type UserRole = string
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'DEACTIVATED' | 'BLOCKED' | 'PENDING_VERIFICATION'

export interface User {
  id: string
  email: string | null
  phone: string | null
  countryCode: string | null
  firstName: string
  lastName: string
  displayName: string | null
  avatar: string | null
  bio: string | null
  role: UserRole
  status: UserStatus
  emailVerified: boolean
  phoneVerified: boolean
  profileCompleted: boolean
  dateOfBirth: string | null
  gender: string | null
  address: string | null
  city: string | null
  district: string | null
  state: string | null
  pincode: string | null
  country: string | null
  highestEducation: string | null
  institution: string | null
  interests: string[]
  timezone: string | null
  language: string | null
  lastLoginAt: string | null
  createdAt: string
  permissions: string[]
}

export interface AuthTokens {
  accessToken: string
}

/** POST /api/auth/login request */
export interface LoginRequest {
  identifier: string
  type: 'email' | 'phone'
  countryCode?: string
}

/** POST /api/auth/verify-otp request */
export interface VerifyOtpRequest {
  identifier: string
  otp: string
  type: 'email' | 'phone'
  role?: 'LEARNER' | 'EDUCATOR'
}

/** POST /api/auth/register request */
export interface RegisterRequest {
  email?: string
  phone?: string
  firstName: string
  lastName: string
  role?: UserRole
}

/** Response from verify-otp */
export interface LoginResponseData {
  user: User
  tokens: AuthTokens
}

/** Response from refresh */
export interface RefreshTokenResponseData {
  accessToken: string
}

/** Complete profile request */
export interface CompleteProfileRequest {
  firstName?: string
  lastName?: string
  displayName?: string
  bio?: string
  dateOfBirth?: string
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say'
  address?: string
  city?: string
  district?: string
  state?: string
  pincode?: string
  country?: string
  highestEducation?: string
  institution?: string
  interests?: string[]
}
