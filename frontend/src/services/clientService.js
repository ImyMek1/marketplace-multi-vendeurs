import api from './api'

const clientService = {
  async getOrders() {
    const response = await api.get('/orders')
    return response.data
  },

  async getFavorites() {
    const response = await api.get('/favorites')
    return response.data
  },

  async getAddresses() {
    const response = await api.get('/addresses')
    return response.data
  },

  async getNotifications() {
    const response = await api.get('/notifications')
    return response.data
  },

  async getUnreadNotificationsCount() {
    const response = await api.get('/notifications/unread-count')
    return response.data
  },
}

export default clientService