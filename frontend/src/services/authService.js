import api from './api'

const authService = {
  async register(data) {
    const response = await api.post('/auth/register', data)

    return response.data
  },

  async login(data) {
    const response = await api.post('/auth/login', data)

    return response.data
  },

  async logout() {
    const response = await api.post('/auth/logout')

    return response.data
  },

  async getMe() {
    const response = await api.get('/auth/me')

    return response.data
  },

  async forgotPassword(data) {
    const response = await api.post('/auth/forgot-password', data)

    return response.data
  },

  async resetPassword(data) {
    const response = await api.post('/auth/reset-password', data)

    return response.data
  },
}

export default authService