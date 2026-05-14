import axios from 'axios'
import type { 
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

// Log the API URL being used
if (import.meta.env.DEV) {
  console.log('[API] Base URL:', API_BASE_URL)
}
const API_TIMEOUT = 60000 // 60 seconds

// Lazy-loaded auth functions to avoid circular dependency
let getAccessToken: (() => string | null) | null = null
let onTokenRefreshed: ((token: string) => void) | null = null
let onAuthFailed: (() => void) | null = null

/**
 * Initialize axios auth integration.
 * Called once from AuthProvider after context is ready.
 */
export function initializeAxiosAuth(config: {
  getAccessToken: () => string | null
  onTokenRefreshed: (token: string) => void
  onAuthFailed: () => void
}) {
  getAccessToken = config.getAccessToken
  onTokenRefreshed = config.onTokenRefreshed
  onAuthFailed = config.onAuthFailed
}

// ==================== Axios Instance ====================

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: { 
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': '69420',
  },
})

// ==================== Request Interceptor ====================

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    const token = getAccessToken?.()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    if (import.meta.env.DEV) {
      console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`)
    }

    return config
  },
  (error: AxiosError) => Promise.reject(error)
)

// ==================== Centralized Token Refresh ====================

let isRefreshing = false
let refreshPromise: Promise<string> | null = null
let failedQueue: Array<{
  resolve: (value?: unknown) => void
  reject: (reason?: unknown) => void
  config: AxiosRequestConfig
}> = []

function processQueue(newToken: string | null) {
  failedQueue.forEach((req) => {
    if (newToken && req.config.headers) {
      req.config.headers.Authorization = `Bearer ${newToken}`
      req.resolve(api(req.config))
    } else {
      req.reject(new Error('Token refresh failed'))
    }
  })
  failedQueue = []
}

/**
 * Single entry point for refreshing the access token.
 * Deduplicates concurrent calls — only one refresh request is in-flight at a time.
 * Used by both the 401 interceptor and AuthContext session restore.
 */
export function refreshAccessToken(): Promise<string> {
  if (isRefreshing && refreshPromise) {
    return refreshPromise
  }

  isRefreshing = true
  refreshPromise = axios
    .post(
      `${API_BASE_URL}/auth/refresh`,
      {},
      { timeout: API_TIMEOUT, withCredentials: true }
    )
    .then((response) => {
      const newAccessToken = response.data.data.accessToken
      onTokenRefreshed?.(newAccessToken)
      processQueue(newAccessToken)
      return newAccessToken
    })
    .catch((error) => {
      if (import.meta.env.DEV) {
        console.error('[Auth] Token refresh failed:', error.response?.status, JSON.stringify(error.response?.data), 'Has response:', !!error.response, 'Error message:', error.message)
      }
      processQueue(null)
      onAuthFailed?.()
      throw error
    })
    .finally(() => {
      isRefreshing = false
      refreshPromise = null
    })

  return refreshPromise
}

// ==================== Response Interceptor ====================

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean }

    // Only handle 401 with auto-refresh — skip auth endpoints (login, verify-otp, etc.)
    // because their 401s are business errors (role mismatch, invalid OTP), not token expiry.
    const isAuthEndpoint = originalRequest?.url?.match(
      /\/auth\/(login|verify-otp|register|admin\/login|admin\/verify-otp|sso|refresh)/
    )
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true

      // If already refreshing, queue this request to retry after the refresh completes
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject, config: originalRequest })
        })
      }

      try {
        const newAccessToken = await refreshAccessToken()

        // Update original request header
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
        }

        return api(originalRequest)
      } catch (refreshError) {
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

export default api
export { API_BASE_URL as API_URL }
