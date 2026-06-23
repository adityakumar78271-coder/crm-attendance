export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://api.akcrm.in/api'
export const API_HOST = API_BASE_URL.replace(/\/api\/?$/, '')

export default API_BASE_URL
