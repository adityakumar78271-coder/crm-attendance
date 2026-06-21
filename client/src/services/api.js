import axios from 'axios'

const API_URL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  'http://175.111.97.247:5000/api'

export const API_BASE_URL = API_URL

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default api
