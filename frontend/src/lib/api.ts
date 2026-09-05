import axios, { isAxiosError } from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
})

export function apiErrorMessage(error: unknown, fallback: string) {
  if (!isAxiosError(error)) return fallback
  const data = error.response?.data as { message?: string; title?: string } | string | undefined
  if (typeof data === 'string' && data.trim()) return data
  if (data && typeof data === 'object') {
    if (typeof data.message === 'string' && data.message.trim()) return data.message
    if (typeof data.title === 'string' && data.title.trim()) return data.title
  }
  if (!error.response) return 'Cannot reach the server. Make sure the API is running, then try again.'
  if (error.response.status === 403) return 'You do not have permission to do that.'
  return fallback
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  },
)

export default api
