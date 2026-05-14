/** Common API response wrapper from backend */
export interface ApiResponse<T = unknown> {
  success: boolean
  data: T
  meta?: PaginationMeta
  error?: ApiError
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export interface ApiError {
  code: string
  message: string
  details?: Record<string, unknown>
}

/** Paginated query params */
export interface PaginationParams {
  page?: number
  limit?: number
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}
